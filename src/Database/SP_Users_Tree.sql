USE [DBEntekhabat];
GO

CREATE OR ALTER PROCEDURE [Security].[SP_Users_Tree]
    @CurrentMahal INT,
    @ParentMahal BIGINT = NULL,
    @ParentType VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @CurrentMahal IS NULL OR @CurrentMahal < 1
        THROW 51020, N'محل خدمت کاربر معتبر نیست.', 1;

    IF @ParentType IS NOT NULL AND @ParentType NOT IN ('headquarters', 'province', 'district', 'county', 'current')
        THROW 51027, N'نوع محل معتبر نیست.', 1;
    IF @CurrentMahal <> 1 AND @ParentMahal IS NOT NULL AND @ParentMahal <> @CurrentMahal
        THROW 51021, N'دسترسی به محل انتخاب‌شده مجاز نیست.', 1;

    CREATE TABLE #Locations
    (
        [LocationId] VARCHAR(20) NOT NULL,
        [ParentId] VARCHAR(20) NULL,
        [LocationName] NVARCHAR(1000) NOT NULL,
        [LocationType] VARCHAR(20) NOT NULL
    );

    IF @CurrentMahal <> 1
    BEGIN
        IF @ParentMahal IS NULL
            INSERT INTO #Locations
            SELECT CONVERT(VARCHAR(20), C.[CityId]), NULL,
                   LEFT(COALESCE(NULLIF(LTRIM(RTRIM(C.[FullName])), N''), C.[Name], CONVERT(NVARCHAR(20), C.[CityId])), 1000),
                   'current'
            FROM [dbo].[Citys] C
            WHERE C.[CityId] = @CurrentMahal;
    END
    ELSE IF @ParentMahal IS NULL
    BEGIN
        INSERT INTO #Locations VALUES ('1', NULL, N'ستاد مرکزی', 'headquarters');

        -- فقط استان‌ها: در ساختار Citys استان‌ها مستقیماً زیر شناسه 1 هستند.
        INSERT INTO #Locations
        SELECT CONVERT(VARCHAR(20), C.[CityId]), '1',
               LEFT(COALESCE(NULLIF(LTRIM(RTRIM(C.[FullName])), N''), C.[Name], CONVERT(NVARCHAR(20), C.[CityId])), 1000),
               'province'
        FROM [dbo].[Citys] C
        WHERE C.[PCityId] = 1
          AND C.[CityId] <> 1
          AND C.[IsActive] = 1;
    END
    ELSE IF @ParentType = 'province'
    BEGIN
        -- حوزه‌های اصلی، مستقیماً با PCityId استان مشخص می‌شوند.
        INSERT INTO #Locations
        SELECT CONVERT(VARCHAR(20), C.[CityId]), CONVERT(VARCHAR(20), @ParentMahal),
               LEFT(COALESCE(NULLIF(LTRIM(RTRIM(C.[FullName])), N''), C.[Name], CONVERT(NVARCHAR(20), C.[CityId])), 1000),
               'district'
        FROM [dbo].[Citys] C
        WHERE C.[PCityId] = @ParentMahal
          AND C.[IsHoze] = 1
          AND LEN(CONVERT(VARCHAR(20), C.[CityId])) = 5
          AND C.[IsActive] = 1;
    END
    ELSE IF @ParentType = 'district'
    BEGIN
        -- فقط شهرستان‌های حوزه انتخابیه انتخاب‌شده.
        INSERT INTO #Locations
        SELECT CONVERT(VARCHAR(20), C.[CityId]), CONVERT(VARCHAR(20), @ParentMahal),
               LEFT(COALESCE(NULLIF(LTRIM(RTRIM(C.[FullName])), N''), C.[Name], CONVERT(NVARCHAR(20), C.[CityId])), 1000),
               'county'
        FROM [dbo].[Citys] C
        WHERE C.[CityIdHozeh] = @ParentMahal
          AND C.[CityId] <> @ParentMahal
          AND ISNULL(C.[IsHoze], 0) = 0
          AND LEN(CONVERT(VARCHAR(20), C.[CityId])) = 5
          AND C.[IsActive] = 1;
    END;

    SELECT [LocationId], [ParentId], [LocationName], [LocationType]
    FROM #Locations
    ORDER BY CASE [LocationType] WHEN 'headquarters' THEN 1 WHEN 'province' THEN 2 WHEN 'district' THEN 3 ELSE 4 END,
             [LocationName];

    -- فقط کاربران محل بازشده؛ در بارگذاری اول فقط کاربران ستاد دریافت می‌شوند.
    DECLARE @UsersMahal BIGINT = CASE WHEN @ParentMahal IS NULL THEN @CurrentMahal ELSE @ParentMahal END;
    SELECT
        CONVERT(VARCHAR(20), U.[UserId]) AS [UserId],
        CONVERT(VARCHAR(20), U.[PersonId]) AS [PersonId],
        CONVERT(VARCHAR(20), U.[Mahal]) AS [LocationId],
        P.[CodeMelli],
        P.[FirstName],
        P.[LastName],
        P.[TelHamrah],
        S.[OnvanPost],
        P.[IsActive],
        CONVERT(BIT, CASE WHEN PI.[PersonId] IS NULL THEN 0 ELSE 1 END) AS [HasPhoto]
    FROM [Security].[Users] AS U
    INNER JOIN [Person].[Persons] AS P ON P.[PersonId] = U.[PersonId]
    INNER JOIN [Security].[Posts] AS S ON S.[PostId] = U.[PostId]
    LEFT JOIN [Person].[PersonImages] AS PI ON PI.[PersonId] = P.[PersonId]
    WHERE P.[IsDelete] = 0
      AND U.[Mahal] = @UsersMahal
    ORDER BY P.[FirstName], P.[LastName];

    SELECT COUNT_BIG(1) AS [TotalUsers]
    FROM [Security].[Users] U
    INNER JOIN [Person].[Persons] P ON P.[PersonId] = U.[PersonId]
    WHERE P.[IsDelete] = 0
      AND (@CurrentMahal = 1 OR U.[Mahal] = @CurrentMahal);
END;
GO

CREATE OR ALTER PROCEDURE [Security].[SP_Users_CreateOptions]
    @CurrentMahal INT,
    @TargetMahal INT
AS
BEGIN
    SET NOCOUNT ON;
    IF @CurrentMahal <> 1 AND @CurrentMahal <> @TargetMahal
        THROW 51021, N'دسترسی به محل انتخاب‌شده مجاز نیست.', 1;

    DECLARE @TypeMahal TINYINT = CASE
        WHEN @TargetMahal = 1 THEN 1
        WHEN EXISTS (SELECT 1 FROM [dbo].[Citys] WHERE [CityId] = @TargetMahal AND [PCityId] = 1) THEN 2
        WHEN EXISTS (SELECT 1 FROM [dbo].[Citys] WHERE [CityId] = @TargetMahal AND [IsHoze] = 1 AND [CityIdHozeh] = [CityId]) THEN 3
        WHEN EXISTS (SELECT 1 FROM [dbo].[Citys] WHERE [CityId] = @TargetMahal AND ISNULL([IsHoze], 0) = 0 AND [CityIdHozeh] IS NOT NULL AND [CityIdHozeh] <> [CityId]) THEN 4
        ELSE 2 END;

    SELECT CONVERT(VARCHAR(20), P.[PersonId]) AS [Value],
           CONCAT(
               P.[FirstName], N' ', P.[LastName], N' - ',
               CASE WHEN P.[Mahal] = 1 THEN N'ستاد مرکزی'
                    ELSE COALESCE(NULLIF(LTRIM(RTRIM(C.[FullName])), N''), C.[Name], CONVERT(NVARCHAR(20), P.[Mahal])) END
           ) AS [Label],
           CONCAT(N'کد ملی: ', P.[CodeMelli]) AS [Description]
    FROM [Person].[Persons] AS P
    LEFT JOIN [dbo].[Citys] AS C ON C.[CityId] = P.[Mahal]
    WHERE P.[Mahal] = @TargetMahal AND P.[IsActive] = 1 AND P.[IsDelete] = 0
      AND NOT EXISTS (SELECT 1 FROM [Security].[Users] U WHERE U.[PersonId] = P.[PersonId])
    ORDER BY P.[FirstName], P.[LastName];

    SELECT CONVERT(VARCHAR(20), S.[PostId]) AS [Value], S.[OnvanPost] AS [Label]
    FROM [Security].[Posts] AS S
    WHERE S.[TypeMahal] = @TypeMahal
    ORDER BY S.[OnvanPost];

    SELECT CONVERT(VARCHAR(20), ISNULL(MAX([UserId]), 0) + 1) AS [NextUserId]
    FROM [Security].[Users];
END;
GO

CREATE OR ALTER PROCEDURE [Security].[SP_Users_Insert]
    @CurrentMahal INT,
    @UserId BIGINT,
    @PersonId BIGINT,
    @Mahal INT,
    @PostId INT,
    @PasswordHash NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @UserId IS NULL OR @UserId < 1
        THROW 51028, N'نام کاربر معتبر نیست.', 1;
    BEGIN TRANSACTION;
    IF @CurrentMahal <> 1 AND @CurrentMahal <> @Mahal
        THROW 51021, N'دسترسی به محل انتخاب‌شده مجاز نیست.', 1;
    IF NOT EXISTS (SELECT 1 FROM [Person].[Persons] WHERE [PersonId] = @PersonId AND [Mahal] = @Mahal AND [IsActive] = 1 AND [IsDelete] = 0)
        THROW 51022, N'شخص انتخاب‌شده برای این محل معتبر نیست.', 1;
    IF EXISTS (SELECT 1 FROM [Security].[Users] WHERE [PersonId] = @PersonId)
        THROW 51023, N'برای این شخص قبلاً حساب کاربری ساخته شده است.', 1;
    IF EXISTS (SELECT 1 FROM [Security].[Users] WITH (UPDLOCK, HOLDLOCK) WHERE [UserId] = @UserId)
        THROW 51029, N'این نام کاربر قبلاً ثبت شده است.', 1;
    DECLARE @TypeMahal TINYINT = CASE
        WHEN @Mahal = 1 THEN 1
        WHEN EXISTS (SELECT 1 FROM [dbo].[Citys] WHERE [CityId] = @Mahal AND [PCityId] = 1) THEN 2
        WHEN EXISTS (SELECT 1 FROM [dbo].[Citys] WHERE [CityId] = @Mahal AND [IsHoze] = 1 AND [CityIdHozeh] = [CityId]) THEN 3
        WHEN EXISTS (SELECT 1 FROM [dbo].[Citys] WHERE [CityId] = @Mahal AND ISNULL([IsHoze], 0) = 0 AND [CityIdHozeh] IS NOT NULL AND [CityIdHozeh] <> [CityId]) THEN 4
        ELSE 2 END;
    IF NOT EXISTS (SELECT 1 FROM [Security].[Posts] WHERE [PostId] = @PostId AND [TypeMahal] = @TypeMahal)
        THROW 51024, N'سمت انتخاب‌شده با محل کاربر سازگار نیست.', 1;

    INSERT INTO [Security].[Users] ([UserId], [PersonId], [Mahal], [PostId], [Password])
    VALUES (@UserId, @PersonId, @Mahal, @PostId, @PasswordHash);

    COMMIT TRANSACTION;
    SELECT CONVERT(VARCHAR(20), @UserId) AS [UserId];
END;
GO

CREATE OR ALTER PROCEDURE [Security].[SP_Users_Delete]
    @CurrentUserId BIGINT,
    @CurrentMahal INT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    IF @CurrentUserId = @UserId
        THROW 51025, N'حذف حساب کاربری جاری مجاز نیست.', 1;
    IF NOT EXISTS (SELECT 1 FROM [Security].[Users] WHERE [UserId] = @UserId AND (@CurrentMahal = 1 OR [Mahal] = @CurrentMahal))
        THROW 51026, N'کاربر موردنظر پیدا نشد یا دسترسی حذف آن را ندارید.', 1;
    DELETE FROM [Security].[Users] WHERE [UserId] = @UserId;
END;
GO

CREATE OR ALTER PROCEDURE [Security].[SP_Users_ResetPassword]
    @CurrentMahal INT,
    @UserId BIGINT,
    @PasswordHash NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Security].[Users]
        WHERE [UserId] = @UserId
          AND (@CurrentMahal = 1 OR [Mahal] = @CurrentMahal)
    )
        THROW 51030, N'کاربر موردنظر پیدا نشد یا دسترسی تغییر رمز او را ندارید.', 1;

    UPDATE [Security].[Users]
    SET [Password] = @PasswordHash
    WHERE [UserId] = @UserId;
END;
GO
