USE [master];
GO

IF DB_ID(N'DBEntekhabatFiles') IS NULL
    CREATE DATABASE [DBEntekhabatFiles];
GO

USE [DBEntekhabatFiles];
GO

IF SCHEMA_ID(N'Person') IS NULL
    EXEC(N'CREATE SCHEMA [Person] AUTHORIZATION [dbo];');
GO

IF OBJECT_ID(N'[Person].[PersonImageFiles]', N'U') IS NULL
BEGIN
    CREATE TABLE [Person].[PersonImageFiles]
    (
        [FileId] BIGINT IDENTITY(1,1) NOT NULL,
        [FileName] NVARCHAR(260) NOT NULL,
        [FileData] VARBINARY(MAX) NOT NULL,
        CONSTRAINT [PK_PersonImageFiles] PRIMARY KEY CLUSTERED ([FileId]),
        CONSTRAINT [UX_PersonImageFiles_FileName] UNIQUE ([FileName])
    );
END;
GO

USE [DBEntekhabat];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
GO

IF SCHEMA_ID(N'Person') IS NULL
    EXEC(N'CREATE SCHEMA [Person] AUTHORIZATION [dbo];');
GO

CREATE OR ALTER FUNCTION [dbo].[NormalizePersianText]
(
    @Input NVARCHAR(MAX)
)
RETURNS NVARCHAR(MAX)
AS
BEGIN
    IF @Input IS NULL RETURN NULL;
    DECLARE @Result NVARCHAR(MAX) = @Input;
    SET @Result = REPLACE(@Result COLLATE Latin1_General_100_BIN2, NCHAR(1610), NCHAR(1740));
    SET @Result = REPLACE(@Result COLLATE Latin1_General_100_BIN2, NCHAR(1609), NCHAR(1740));
    SET @Result = REPLACE(@Result COLLATE Latin1_General_100_BIN2, NCHAR(1603), NCHAR(1705));
    SET @Result = REPLACE(@Result COLLATE Latin1_General_100_BIN2, NCHAR(1577), NCHAR(1607));
    SET @Result = REPLACE(@Result COLLATE Latin1_General_100_BIN2, NCHAR(1729), NCHAR(1607));
    SET @Result = REPLACE(@Result COLLATE Latin1_General_100_BIN2, NCHAR(1600), N'');
    SET @Result = TRANSLATE(@Result, N'٠١٢٣٤٥٦٧٨٩', N'۰۱۲۳۴۵۶۷۸۹');
    SET @Result = REPLACE(@Result COLLATE Latin1_General_100_BIN2, NCHAR(160), N' ');
    WHILE CHARINDEX(N'  ', @Result COLLATE Latin1_General_100_BIN2) > 0
        SET @Result = REPLACE(@Result COLLATE Latin1_General_100_BIN2, N'  ', N' ');
    RETURN LTRIM(RTRIM(@Result));
END;
GO

IF OBJECT_ID(N'[Person].[Persons]', N'U') IS NULL
BEGIN
    CREATE TABLE [Person].[Persons]
    (
        [PersonId] BIGINT IDENTITY(1,1) NOT NULL,
        [ShomarehParvandeh] BIGINT NULL,
        [CodeMelli] VARCHAR(10) NOT NULL,
        [SerialKartMelli] NVARCHAR(30) NULL,
        [TelHamrah] VARCHAR(15) NULL,
        [FirstName] NVARCHAR(100) NOT NULL,
        [LastName] NVARCHAR(200) NOT NULL,
        [FatherName] NVARCHAR(100) NULL,
        [TarikhTavalod] NCHAR(10) NULL,
        [ShomareShenasnameh] NVARCHAR(30) NULL,
        [SerialShenasnameh] NVARCHAR(30) NULL,
        [MahalTavalod] INT NULL,
        [MahalSodor] INT NULL,
        [Jensiyat] INT NULL,
        [Taahol] INT NULL,
        [Din_Mazhab] INT NULL,
        [IsActive] BIT NOT NULL CONSTRAINT [DF_Persons_IsActive] DEFAULT (1),
        [PhoneNumber] VARCHAR(20) NULL,
        [Mahal] INT NOT NULL,
        [CreateUserId] BIGINT NULL,
        [CreateDateTime] NVARCHAR(25) NOT NULL,
        [IsDelete] BIT NOT NULL CONSTRAINT [DF_Persons_IsDelete] DEFAULT (0),
        CONSTRAINT [PK_Persons] PRIMARY KEY CLUSTERED ([PersonId])
    );
    CREATE UNIQUE INDEX [UX_Persons_CodeMelli] ON [Person].[Persons] ([CodeMelli]);
    CREATE UNIQUE INDEX [UX_Persons_ShomarehParvandeh]
        ON [Person].[Persons] ([ShomarehParvandeh]) WHERE [ShomarehParvandeh] IS NOT NULL;
    CREATE INDEX [IX_Persons_Mahal_IsActive_IsDelete]
        ON [Person].[Persons] ([Mahal], [IsActive], [IsDelete]);
END;
GO

IF OBJECT_ID(N'[Person].[PersonImages]', N'U') IS NULL
BEGIN
    CREATE TABLE [Person].[PersonImages]
    (
        [PersonId] BIGINT NOT NULL,
        [FileName] NVARCHAR(260) NOT NULL,
        CONSTRAINT [PK_PersonImages] PRIMARY KEY CLUSTERED ([PersonId]),
        CONSTRAINT [UX_PersonImages_FileName] UNIQUE ([FileName]),
        CONSTRAINT [FK_PersonImages_Persons] FOREIGN KEY ([PersonId])
            REFERENCES [Person].[Persons] ([PersonId])
    );
END;
GO

/* انتقال تصاویر نسخه قبلی و حذف باینری از جدول Persons */
IF COL_LENGTH(N'[Person].[Persons]', N'PersonalPhoto') IS NOT NULL
BEGIN
    EXEC sys.sp_executesql N'
        INSERT INTO [DBEntekhabatFiles].[Person].[PersonImageFiles] ([FileName], [FileData])
        SELECT CONCAT(N''person-'', P.[PersonId], N''-legacy.bin''), P.[PersonalPhoto]
        FROM [Person].[Persons] AS P
        WHERE P.[PersonalPhoto] IS NOT NULL
          AND NOT EXISTS
          (
              SELECT 1 FROM [DBEntekhabatFiles].[Person].[PersonImageFiles] AS F
              WHERE F.[FileName] = CONCAT(N''person-'', P.[PersonId], N''-legacy.bin'')
          );

        INSERT INTO [Person].[PersonImages] ([PersonId], [FileName])
        SELECT P.[PersonId], CONCAT(N''person-'', P.[PersonId], N''-legacy.bin'')
        FROM [Person].[Persons] AS P
        WHERE P.[PersonalPhoto] IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM [Person].[PersonImages] AS I WHERE I.[PersonId] = P.[PersonId]);
    ';
    ALTER TABLE [Person].[Persons] DROP COLUMN [PersonalPhoto];
END;
GO

IF COL_LENGTH(N'[Person].[Persons]', N'PersonalPhotoContentType') IS NOT NULL
    ALTER TABLE [Person].[Persons] DROP COLUMN [PersonalPhotoContentType];
GO

CREATE OR ALTER PROCEDURE [Person].[SP_Persons_List]
    @PageNumber INT = 1,
    @PageSize INT = 15,
    @SearchText NVARCHAR(250) = NULL,
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @PageNumber = CASE WHEN @PageNumber < 1 THEN 1 ELSE @PageNumber END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 15 WHEN @PageSize > 100 THEN 100 ELSE @PageSize END;
    SET @SearchText = NULLIF([dbo].[NormalizePersianText](@SearchText), N'');

    SELECT
        CONVERT(VARCHAR(20), P.[PersonId]) AS [PersonId],
        CASE WHEN P.[ShomarehParvandeh] IS NULL THEN NULL ELSE CONVERT(VARCHAR(20), P.[ShomarehParvandeh]) END AS [ShomarehParvandeh],
        P.[CodeMelli], P.[SerialKartMelli], P.[TelHamrah], P.[FirstName], P.[LastName], P.[FatherName],
        RTRIM(P.[TarikhTavalod]) AS [TarikhTavalod], P.[ShomareShenasnameh], P.[SerialShenasnameh],
        P.[MahalTavalod], MT.[FullName] AS [MahalTavalodName],
        P.[MahalSodor], MS.[FullName] AS [MahalSodorName],
        P.[Jensiyat], P.[Taahol], P.[Din_Mazhab], P.[IsActive], P.[PhoneNumber],
        P.[Mahal], M.[FullName] AS [MahalName],
        CONVERT(BIT, CASE WHEN PI.[PersonId] IS NULL THEN 0 ELSE 1 END) AS [HasPhoto],
        CONVERT(VARCHAR(20), P.[CreateUserId]) AS [CreateUserId], P.[CreateDateTime]
    FROM [Person].[Persons] AS P
    LEFT JOIN [Person].[PersonImages] AS PI ON PI.[PersonId] = P.[PersonId]
    LEFT JOIN [dbo].[Citys] AS MT ON MT.[CityId] = P.[MahalTavalod]
    LEFT JOIN [dbo].[Citys] AS MS ON MS.[CityId] = P.[MahalSodor]
    LEFT JOIN [dbo].[Citys] AS M ON M.[CityId] = P.[Mahal]
    WHERE P.[IsDelete] = 0
      AND (@IsActive IS NULL OR P.[IsActive] = @IsActive)
      AND (@SearchText IS NULL
        OR [dbo].[NormalizePersianText](P.[FirstName]) LIKE N'%' + @SearchText + N'%'
        OR [dbo].[NormalizePersianText](P.[LastName]) LIKE N'%' + @SearchText + N'%'
        OR P.[CodeMelli] LIKE '%' + CONVERT(VARCHAR(250), @SearchText) + '%'
        OR P.[TelHamrah] LIKE '%' + CONVERT(VARCHAR(250), @SearchText) + '%'
        OR CONVERT(VARCHAR(20), P.[ShomarehParvandeh]) LIKE '%' + CONVERT(VARCHAR(250), @SearchText) + '%')
    ORDER BY P.[PersonId] DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT COUNT_BIG(1) AS [TotalCount]
    FROM [Person].[Persons] AS P
    WHERE P.[IsDelete] = 0
      AND (@IsActive IS NULL OR P.[IsActive] = @IsActive)
      AND (@SearchText IS NULL
        OR [dbo].[NormalizePersianText](P.[FirstName]) LIKE N'%' + @SearchText + N'%'
        OR [dbo].[NormalizePersianText](P.[LastName]) LIKE N'%' + @SearchText + N'%'
        OR P.[CodeMelli] LIKE '%' + CONVERT(VARCHAR(250), @SearchText) + '%'
        OR P.[TelHamrah] LIKE '%' + CONVERT(VARCHAR(250), @SearchText) + '%'
        OR CONVERT(VARCHAR(20), P.[ShomarehParvandeh]) LIKE '%' + CONVERT(VARCHAR(250), @SearchText) + '%');
END;
GO

CREATE OR ALTER PROCEDURE [Person].[SP_Persons_Photo_Get]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT PI.[FileName], PF.[FileData]
    FROM [Person].[Persons] AS P
    INNER JOIN [Person].[PersonImages] AS PI ON PI.[PersonId] = P.[PersonId]
    INNER JOIN [DBEntekhabatFiles].[Person].[PersonImageFiles] AS PF ON PF.[FileName] = PI.[FileName]
    WHERE P.[PersonId] = @PersonId AND P.[IsDelete] = 0;
END;
GO

CREATE OR ALTER PROCEDURE [Person].[SP_Persons_Photo_Save]
    @PersonId BIGINT,
    @FileName NVARCHAR(260),
    @FileData VARBINARY(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM [Person].[Persons] WHERE [PersonId] = @PersonId AND [IsDelete] = 0)
        THROW 51004, N'شخص موردنظر پیدا نشد.', 1;

    DECLARE @OldFileName NVARCHAR(260);
    SELECT @OldFileName = [FileName] FROM [Person].[PersonImages] WHERE [PersonId] = @PersonId;

    BEGIN TRANSACTION;
    INSERT INTO [DBEntekhabatFiles].[Person].[PersonImageFiles] ([FileName], [FileData])
    VALUES (@FileName, @FileData);

    IF @OldFileName IS NULL
        INSERT INTO [Person].[PersonImages] ([PersonId], [FileName]) VALUES (@PersonId, @FileName);
    ELSE
        UPDATE [Person].[PersonImages] SET [FileName] = @FileName WHERE [PersonId] = @PersonId;

    IF @OldFileName IS NOT NULL AND @OldFileName <> @FileName
        DELETE FROM [DBEntekhabatFiles].[Person].[PersonImageFiles] WHERE [FileName] = @OldFileName;
    COMMIT TRANSACTION;
END;
GO

CREATE OR ALTER PROCEDURE [Person].[SP_Persons_Photo_Delete]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @FileName NVARCHAR(260);
    SELECT @FileName = [FileName] FROM [Person].[PersonImages] WHERE [PersonId] = @PersonId;
    IF @FileName IS NULL RETURN;

    BEGIN TRANSACTION;
    DELETE FROM [Person].[PersonImages] WHERE [PersonId] = @PersonId;
    DELETE FROM [DBEntekhabatFiles].[Person].[PersonImageFiles] WHERE [FileName] = @FileName;
    COMMIT TRANSACTION;
END;
GO

CREATE OR ALTER PROCEDURE [Person].[SP_Persons_Locations]
    @SearchText NVARCHAR(250) = NULL,
    @OnlyCounty BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET @SearchText = NULLIF([dbo].[NormalizePersianText](@SearchText), N'');
    SELECT TOP (2000)
        CONVERT(VARCHAR(20), C.[CityId]) AS [Value],
        COALESCE(NULLIF(C.[FullName], N''), C.[Name]) AS [Label],
        C.[Name] AS [Description]
    FROM [dbo].[Citys] AS C
    WHERE ISNULL(C.[IsActive], 1) = 1
      AND (@OnlyCounty = 0 OR LEN(CONVERT(VARCHAR(20), C.[CityId])) = 5)
      AND (@SearchText IS NULL
        OR [dbo].[NormalizePersianText](C.[Name]) LIKE N'%' + @SearchText + N'%'
        OR [dbo].[NormalizePersianText](C.[FullName]) LIKE N'%' + @SearchText + N'%'
        OR CONVERT(VARCHAR(20), C.[CityId]) LIKE '%' + CONVERT(VARCHAR(250), @SearchText) + '%')
    ORDER BY C.[PCityId], C.[Name];
END;
GO

CREATE OR ALTER PROCEDURE [Person].[SP_Persons_DefinitionOptions]
    @ParentId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        CONVERT(VARCHAR(20), D.[ID]) AS [Value],
        D.[NameFarsi] AS [Label],
        CASE WHEN D.[Value] IS NULL THEN NULL ELSE CONVERT(NVARCHAR(20), D.[Value]) END AS [Description]
    FROM [dbo].[DFN] AS D
    WHERE D.[PID] = @ParentId
    ORDER BY ISNULL(D.[Value], 2147483647), D.[ID];
END;
GO

CREATE OR ALTER PROCEDURE [Person].[SP_Persons_Insert]
    @ShomarehParvandeh BIGINT = NULL,
    @CodeMelli VARCHAR(10),
    @SerialKartMelli NVARCHAR(30) = NULL,
    @TelHamrah VARCHAR(15) = NULL,
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(200),
    @FatherName NVARCHAR(100) = NULL,
    @TarikhTavalod NCHAR(10) = NULL,
    @ShomareShenasnameh NVARCHAR(30) = NULL,
    @SerialShenasnameh NVARCHAR(30) = NULL,
    @MahalTavalod INT = NULL,
    @MahalSodor INT = NULL,
    @Jensiyat INT = NULL,
    @Taahol INT = NULL,
    @Din_Mazhab INT = NULL,
    @IsActive BIT = 1,
    @PhoneNumber VARCHAR(20) = NULL,
    @Mahal INT,
    @CreateUserId BIGINT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @FirstName = [dbo].[NormalizePersianText](@FirstName);
    SET @LastName = [dbo].[NormalizePersianText](@LastName);
    SET @FatherName = [dbo].[NormalizePersianText](@FatherName);
    SET @SerialKartMelli = [dbo].[NormalizePersianText](@SerialKartMelli);
    SET @ShomareShenasnameh = [dbo].[NormalizePersianText](@ShomareShenasnameh);
    SET @SerialShenasnameh = [dbo].[NormalizePersianText](@SerialShenasnameh);

    IF ISNULL([dbo].[IsValidIranNationalCode](CONVERT(NCHAR(10), @CodeMelli)), 0) = 0
        THROW 51005, N'کد ملی واردشده معتبر نیست.', 1;
    IF @TelHamrah IS NOT NULL
       AND ISNULL([dbo].[IsValidIranMobileNumber](CONVERT(NVARCHAR(15), @TelHamrah)), 0) = 0
        THROW 51006, N'شماره همراه واردشده معتبر نیست.', 1;

    IF EXISTS (SELECT 1 FROM [Person].[Persons] WHERE [CodeMelli] = @CodeMelli AND [IsDelete] = 0)
        THROW 51001, N'کد ملی قبلاً ثبت شده است.', 1;
    IF @ShomarehParvandeh IS NOT NULL AND EXISTS
       (SELECT 1 FROM [Person].[Persons] WHERE [ShomarehParvandeh] = @ShomarehParvandeh AND [IsDelete] = 0)
        THROW 51002, N'شماره پرونده قبلاً ثبت شده است.', 1;

    INSERT INTO [Person].[Persons]
    (
        [ShomarehParvandeh], [CodeMelli], [SerialKartMelli], [TelHamrah], [FirstName], [LastName],
        [FatherName], [TarikhTavalod], [ShomareShenasnameh], [SerialShenasnameh], [MahalTavalod],
        [MahalSodor], [Jensiyat], [Taahol], [Din_Mazhab], [IsActive], [PhoneNumber], [Mahal],
        [CreateUserId], [CreateDateTime], [IsDelete]
    )
    VALUES
    (
        @ShomarehParvandeh, @CodeMelli, @SerialKartMelli, @TelHamrah, @FirstName, @LastName,
        @FatherName, @TarikhTavalod, @ShomareShenasnameh, @SerialShenasnameh, @MahalTavalod,
        @MahalSodor, @Jensiyat, @Taahol, @Din_Mazhab, @IsActive, @PhoneNumber, @Mahal,
        @CreateUserId, [dbo].[FarsiDateTimeNow](), 0
    );
    SELECT CONVERT(VARCHAR(20), SCOPE_IDENTITY()) AS [PersonId];
END;
GO

CREATE OR ALTER PROCEDURE [Person].[SP_Persons_Update]
    @PersonId BIGINT,
    @ShomarehParvandeh BIGINT = NULL,
    @CodeMelli VARCHAR(10),
    @SerialKartMelli NVARCHAR(30) = NULL,
    @TelHamrah VARCHAR(15) = NULL,
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(200),
    @FatherName NVARCHAR(100) = NULL,
    @TarikhTavalod NCHAR(10) = NULL,
    @ShomareShenasnameh NVARCHAR(30) = NULL,
    @SerialShenasnameh NVARCHAR(30) = NULL,
    @MahalTavalod INT = NULL,
    @MahalSodor INT = NULL,
    @Jensiyat INT = NULL,
    @Taahol INT = NULL,
    @Din_Mazhab INT = NULL,
    @IsActive BIT,
    @PhoneNumber VARCHAR(20) = NULL,
    @Mahal INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @FirstName = [dbo].[NormalizePersianText](@FirstName);
    SET @LastName = [dbo].[NormalizePersianText](@LastName);
    SET @FatherName = [dbo].[NormalizePersianText](@FatherName);
    SET @SerialKartMelli = [dbo].[NormalizePersianText](@SerialKartMelli);
    SET @ShomareShenasnameh = [dbo].[NormalizePersianText](@ShomareShenasnameh);
    SET @SerialShenasnameh = [dbo].[NormalizePersianText](@SerialShenasnameh);

    IF ISNULL([dbo].[IsValidIranNationalCode](CONVERT(NCHAR(10), @CodeMelli)), 0) = 0
        THROW 51005, N'کد ملی واردشده معتبر نیست.', 1;
    IF @TelHamrah IS NOT NULL
       AND ISNULL([dbo].[IsValidIranMobileNumber](CONVERT(NVARCHAR(15), @TelHamrah)), 0) = 0
        THROW 51006, N'شماره همراه واردشده معتبر نیست.', 1;

    IF EXISTS (SELECT 1 FROM [Person].[Persons]
               WHERE [CodeMelli] = @CodeMelli AND [PersonId] <> @PersonId AND [IsDelete] = 0)
        THROW 51001, N'کد ملی قبلاً ثبت شده است.', 1;
    IF @ShomarehParvandeh IS NOT NULL AND EXISTS
       (SELECT 1 FROM [Person].[Persons]
        WHERE [ShomarehParvandeh] = @ShomarehParvandeh AND [PersonId] <> @PersonId AND [IsDelete] = 0)
        THROW 51002, N'شماره پرونده قبلاً ثبت شده است.', 1;

    UPDATE [Person].[Persons]
    SET [ShomarehParvandeh] = @ShomarehParvandeh,
        [CodeMelli] = @CodeMelli,
        [SerialKartMelli] = @SerialKartMelli,
        [TelHamrah] = @TelHamrah,
        [FirstName] = @FirstName,
        [LastName] = @LastName,
        [FatherName] = @FatherName,
        [TarikhTavalod] = @TarikhTavalod,
        [ShomareShenasnameh] = @ShomareShenasnameh,
        [SerialShenasnameh] = @SerialShenasnameh,
        [MahalTavalod] = @MahalTavalod,
        [MahalSodor] = @MahalSodor,
        [Jensiyat] = @Jensiyat,
        [Taahol] = @Taahol,
        [Din_Mazhab] = @Din_Mazhab,
        [IsActive] = @IsActive,
        [PhoneNumber] = @PhoneNumber,
        [Mahal] = @Mahal
    WHERE [PersonId] = @PersonId AND [IsDelete] = 0;

    IF @@ROWCOUNT = 0 THROW 51004, N'شخص موردنظر پیدا نشد.', 1;
END;
GO

CREATE OR ALTER PROCEDURE [Person].[SP_Persons_Delete]
    @PersonId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF EXISTS (SELECT 1 FROM [Security].[Users] WHERE [PersonId] = @PersonId)
        THROW 51003, N'برای این شخص حساب کاربری ثبت شده و حذف آن مجاز نیست.', 1;

    DECLARE @FileName NVARCHAR(260);
    SELECT @FileName = [FileName] FROM [Person].[PersonImages] WHERE [PersonId] = @PersonId;

    BEGIN TRANSACTION;
    DELETE FROM [Person].[PersonImages] WHERE [PersonId] = @PersonId;
    IF @FileName IS NOT NULL
        DELETE FROM [DBEntekhabatFiles].[Person].[PersonImageFiles] WHERE [FileName] = @FileName;

    UPDATE [Person].[Persons]
    SET [IsDelete] = 1, [IsActive] = 0
    WHERE [PersonId] = @PersonId AND [IsDelete] = 0;

    IF @@ROWCOUNT = 0
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 51004, N'شخص موردنظر پیدا نشد.', 1;
    END;
    COMMIT TRANSACTION;
END;
GO
