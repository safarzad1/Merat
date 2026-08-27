USE [DBEntekhabat];
GO

IF OBJECT_ID(N'[Security].[AuthConfig]', N'U') IS NULL
BEGIN
    CREATE TABLE [Security].[AuthConfig]
    (
        [ConfigKey] SYSNAME NOT NULL,
        [ConfigValue] NVARCHAR(4000) NOT NULL,
        CONSTRAINT [PK_AuthConfig] PRIMARY KEY ([ConfigKey])
    );
END;
GO

DENY SELECT, INSERT, UPDATE, DELETE
ON OBJECT::[Security].[AuthConfig]
TO [public];
GO

/*
    این دستور را فقط یک‌بار با همان مقدار HASH_SECRET فایل env اجرا کنید:

    MERGE [Security].[AuthConfig] AS Target
    USING (SELECT N'HASH_SECRET' AS ConfigKey, N'YOUR_HASH_SECRET' AS ConfigValue) AS Source
       ON Target.[ConfigKey] = Source.[ConfigKey]
    WHEN MATCHED THEN
        UPDATE SET [ConfigValue] = Source.[ConfigValue]
    WHEN NOT MATCHED THEN
        INSERT ([ConfigKey], [ConfigValue])
        VALUES (Source.[ConfigKey], Source.[ConfigValue]);
*/
GO

CREATE OR ALTER PROCEDURE [Security].[SP_User_SetPassword]
    @LoginIdentifier NVARCHAR(50),
    @PlainPassword NVARCHAR(4000)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @LoginIdentifier = LTRIM(RTRIM(@LoginIdentifier));

    IF NULLIF(@LoginIdentifier, N'') IS NULL
        THROW 51001, N'شناسه کاربر یا کد ملی الزامی است.', 1;

    IF NULLIF(@PlainPassword, N'') IS NULL
        THROW 51002, N'کلمه عبور نمی‌تواند خالی باشد.', 1;

    IF LEN(@PlainPassword) < 8
        THROW 51003, N'کلمه عبور باید حداقل 8 نویسه باشد.', 1;

    DECLARE @UserId BIGINT;

    SELECT TOP (1)
        @UserId = [UserId]
    FROM [Security].[VW_LoginUsers]
    WHERE [CodeMelli] = @LoginIdentifier
       OR [UserId] = TRY_CONVERT(BIGINT, @LoginIdentifier);

    IF @UserId IS NULL
        THROW 51004, N'کاربری با این شناسه یا کد ملی پیدا نشد.', 1;

    DECLARE @HashSecret NVARCHAR(4000);

    SELECT @HashSecret = [ConfigValue]
    FROM [Security].[AuthConfig]
    WHERE [ConfigKey] = N'HASH_SECRET';

    IF NULLIF(@HashSecret, N'') IS NULL
        THROW 51005, N'HASH_SECRET در Security.AuthConfig تنظیم نشده است.', 1;

    -- تبدیل متن یونیکد به UTF-8؛ دقیقاً مطابق ورودی createHmac در Node.js
    DECLARE @Key VARBINARY(MAX) = CONVERT(
        VARBINARY(MAX),
        CONVERT(VARCHAR(MAX), @HashSecret COLLATE Latin1_General_100_CI_AS_SC_UTF8)
    );
    DECLARE @Message VARBINARY(MAX) = CONVERT(
        VARBINARY(MAX),
        CONVERT(VARCHAR(MAX), @PlainPassword COLLATE Latin1_General_100_CI_AS_SC_UTF8)
    );

    -- HMAC-SHA256: در صورت بلند بودن کلید، ابتدا SHA256 گرفته می‌شود.
    IF DATALENGTH(@Key) > 64
        SET @Key = HASHBYTES('SHA2_256', @Key);

    DECLARE @KeyBlock VARBINARY(MAX) = @Key;
    WHILE DATALENGTH(@KeyBlock) < 64
        SET @KeyBlock = @KeyBlock + 0x00;

    DECLARE @InnerPad VARBINARY(MAX) = 0x;
    DECLARE @OuterPad VARBINARY(MAX) = 0x;
    DECLARE @Index INT = 1;
    DECLARE @ByteValue INT;

    WHILE @Index <= 64
    BEGIN
        SET @ByteValue = CONVERT(TINYINT, SUBSTRING(@KeyBlock, @Index, 1));
        SET @InnerPad = @InnerPad + CONVERT(BINARY(1), @ByteValue ^ 54); -- 0x36
        SET @OuterPad = @OuterPad + CONVERT(BINARY(1), @ByteValue ^ 92); -- 0x5C
        SET @Index += 1;
    END;

    DECLARE @InnerHash VARBINARY(32) = HASHBYTES(
        'SHA2_256',
        @InnerPad + @Message
    );
    DECLARE @FinalHash VARBINARY(32) = HASHBYTES(
        'SHA2_256',
        @OuterPad + @InnerHash
    );
    DECLARE @PasswordHash VARCHAR(64) = LOWER(CONVERT(VARCHAR(64), @FinalHash, 2));

    UPDATE [Security].[Users]
    SET [Password] = @PasswordHash
    WHERE [UserId] = @UserId;

    SELECT
        [UserId],
        [CodeMelli],
        CAST(1 AS BIT) AS [PasswordUpdated]
    FROM [Security].[VW_LoginUsers]
    WHERE [UserId] = @UserId;
END;
GO

/* نمونه اجرا:
EXEC [Security].[SP_User_SetPassword]
    @LoginIdentifier = N'1',       -- UserId یا CodeMelli
    @PlainPassword = N'Merat@1405';
*/
