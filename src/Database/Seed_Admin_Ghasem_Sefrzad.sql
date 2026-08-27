USE [DBEntekhabat];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @FirstName NVARCHAR(100) = N'قاسم';
DECLARE @LastName NVARCHAR(200) = N'صفرزاد';
DECLARE @CodeMelli VARCHAR(10) = '2120563691';
DECLARE @PlainPassword NVARCHAR(4000) = N'Merat@9Q7v2K6!';
DECLARE @Mahal INT = 1;
DECLARE @AdminPostId INT;
DECLARE @PersonId BIGINT;
DECLARE @UserId BIGINT;

BEGIN TRY
    BEGIN TRANSACTION;

    SELECT @AdminPostId = [PostId]
    FROM [Security].[Posts] WITH (UPDLOCK, HOLDLOCK)
    WHERE [OnvanPost] = N'مدیر سامانه'
      AND [TypeMahal] = 1;

    IF @AdminPostId IS NULL
    BEGIN
        INSERT INTO [Security].[Posts] ([OnvanPost], [TypeMahal])
        VALUES (N'مدیر سامانه', 1);

        SET @AdminPostId = CONVERT(INT, SCOPE_IDENTITY());
    END;

    SELECT @PersonId = [PersonId]
    FROM [Person].[Persons] WITH (UPDLOCK, HOLDLOCK)
    WHERE [CodeMelli] = @CodeMelli;

    IF @PersonId IS NULL
    BEGIN
        INSERT INTO [Person].[Persons]
        (
            [CodeMelli],
            [FirstName],
            [LastName],
            [IsActive],
            [Mahal],
            [CreateDateTime],
            [IsDelete]
        )
        VALUES
        (
            @CodeMelli,
            @FirstName,
            @LastName,
            1,
            @Mahal,
            CONVERT(NVARCHAR(25), SYSDATETIME(), 121),
            0
        );

        SET @PersonId = CONVERT(BIGINT, SCOPE_IDENTITY());
    END
    ELSE
    BEGIN
        UPDATE [Person].[Persons]
        SET [FirstName] = @FirstName,
            [LastName] = @LastName,
            [IsActive] = 1,
            [IsDelete] = 0,
            [Mahal] = @Mahal
        WHERE [PersonId] = @PersonId;
    END;

    SELECT @UserId = [UserId]
    FROM [Security].[Users] WITH (UPDLOCK, HOLDLOCK)
    WHERE [PersonId] = @PersonId;

    IF @UserId IS NULL
    BEGIN
        -- مقدار موقت فقط برای رعایت NOT NULL است و در همین تراکنش هش می‌شود.
        INSERT INTO [Security].[Users]
        (
            [PersonId],
            [Mahal],
            [PostId],
            [Password]
        )
        VALUES
        (
            @PersonId,
            @Mahal,
            @AdminPostId,
            REPLICATE(N'0', 64)
        );

        SET @UserId = CONVERT(BIGINT, SCOPE_IDENTITY());
    END
    ELSE
    BEGIN
        UPDATE [Security].[Users]
        SET [Mahal] = @Mahal,
            [PostId] = @AdminPostId
        WHERE [UserId] = @UserId;
    END;

    EXEC [Security].[SP_User_SetPassword]
        @LoginIdentifier = @CodeMelli,
        @PlainPassword = @PlainPassword;

    COMMIT TRANSACTION;

    SELECT
        U.[UserId],
        P.[CodeMelli],
        P.[FirstName],
        P.[LastName],
        S.[OnvanPost],
        U.[Mahal]
    FROM [Security].[Users] AS U
    INNER JOIN [Person].[Persons] AS P
        ON P.[PersonId] = U.[PersonId]
    INNER JOIN [Security].[Posts] AS S
        ON S.[PostId] = U.[PostId]
    WHERE U.[UserId] = @UserId;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
