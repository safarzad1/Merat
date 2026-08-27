USE [DBEntekhabat];
GO

CREATE OR ALTER PROCEDURE [Davtalab].[SP_Ashkhas_ElectionPeriods]
    @CurrentMahal INT
AS
BEGIN
    SET NOCOUNT ON;

    IF @CurrentMahal IS NULL OR @CurrentMahal < 1
        THROW 51100, N'محل خدمت کاربر معتبر نیست.', 1;

    SELECT
        CONVERT(VARCHAR(20), E.[CodeEntekhabat]) AS [CodeEntekhabat],
        COALESCE(NULLIF(LTRIM(RTRIM(E.[OnvanDore])), N''), CONCAT(N'دوره ', E.[CodeEntekhabat])) AS [OnvanDore],
        E.[VazeyatDore],
        E.[ShomarehDore],
        E.[ShomarehMarhale],
        RTRIM(E.[TarikhEntekhabat]) AS [TarikhEntekhabat],
        A.[IsDefault]
    FROM [Entekhabat].[Entekhabat] AS E
    INNER JOIN
    (
        SELECT EA.[CodeEntekhabat],
               MAX(CONVERT(TINYINT, ISNULL(EA.[IsDefault], 0))) AS [IsDefault]
        FROM [Entekhabat].[EntekhabatActive] AS EA
        WHERE EA.[Mahal] = @CurrentMahal
        GROUP BY EA.[CodeEntekhabat]
    ) AS A ON A.[CodeEntekhabat] = E.[CodeEntekhabat]
    ORDER BY CASE WHEN A.[IsDefault] = 1 THEN 0 ELSE 1 END,
             E.[CodeEntekhabat] DESC;
END;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE [object_id] = OBJECT_ID(N'[Entekhabat].[EntekhabatSavabegh]')
      AND [name] = N'IX_EntekhabatSavabegh_Election_Location_Person'
)
    CREATE NONCLUSTERED INDEX [IX_EntekhabatSavabegh_Election_Location_Person]
    ON [Entekhabat].[EntekhabatSavabegh]
       ([CodeEntekhabat], [Ostan], [CodeHozeh], [ShomarehParvandeh], [ID] DESC)
    INCLUDE ([NameOstan], [NameHozeh], [Natije], [Natije_NameFarsi]);
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE [object_id] = OBJECT_ID(N'[Entekhabat].[EntekhabatHozeh]')
      AND [name] = N'IX_EntekhabatHozeh_Election_Ostan_Markaz'
)
    CREATE NONCLUSTERED INDEX [IX_EntekhabatHozeh_Election_Ostan_Markaz]
    ON [Entekhabat].[EntekhabatHozeh]
       ([CodeEntekhabat], [Ostan], [MarkazHozeh], [CodeHozeh])
    INCLUDE ([NameHozeh]);
GO

CREATE OR ALTER PROCEDURE [Davtalab].[SP_Ashkhas_LocationTree]
    @CurrentMahal INT,
    @CodeEntekhabat BIGINT,
    @ParentOstan INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @CurrentMahal IS NULL OR @CurrentMahal < 1
        THROW 51100, N'محل خدمت کاربر معتبر نیست.', 1;
    IF NOT EXISTS
    (
        SELECT 1
        FROM [Entekhabat].[EntekhabatActive]
        WHERE [Mahal] = @CurrentMahal
          AND [CodeEntekhabat] = @CodeEntekhabat
    )
        THROW 51101, N'این دوره انتخابات برای محل کاربر فعال نیست.', 1;
    DECLARE @AccessType TINYINT = CASE
        WHEN @CurrentMahal = 1 THEN 1
        WHEN EXISTS (SELECT 1 FROM [dbo].[Citys] WHERE [CityId] = @CurrentMahal AND [PCityId] = 1) THEN 2
        WHEN EXISTS (SELECT 1 FROM [dbo].[Citys] WHERE [CityId] = @CurrentMahal AND [IsHoze] = 1 AND [CityIdHozeh] = [CityId]) THEN 3
        ELSE 0 END;
    IF @AccessType = 0
        THROW 51102, N'سطح محل کاربر برای مشاهده داوطلبان معتبر نیست.', 1;
    IF @AccessType <> 1 AND @ParentOstan IS NOT NULL
        THROW 51102, N'دسترسی به استان انتخاب‌شده مجاز نیست.', 1;

    CREATE TABLE #Locations
    (
        [LocationId] VARCHAR(20) NOT NULL,
        [ParentId] VARCHAR(20) NULL,
        [ProvinceId] VARCHAR(20) NULL,
        [LocationName] NVARCHAR(1500) NOT NULL,
        [LocationType] VARCHAR(20) NOT NULL
    );

    IF @ParentOstan IS NULL
    BEGIN
        IF @CurrentMahal = 1
        BEGIN
            INSERT INTO #Locations ([LocationId], [ParentId], [ProvinceId], [LocationName], [LocationType])
            SELECT '1', NULL, NULL, N'ستاد مرکزی', 'headquarters'
            WHERE EXISTS
            (
                SELECT 1
                FROM [Entekhabat].[EntekhabatSavabegh] AS ES
                WHERE ES.[CodeEntekhabat] = @CodeEntekhabat
            );

            INSERT INTO #Locations ([LocationId], [ParentId], [ProvinceId], [LocationName], [LocationType])
            SELECT CONVERT(VARCHAR(20), ES.[Ostan]), '1', CONVERT(VARCHAR(20), ES.[Ostan]),
                   LEFT(COALESCE(NULLIF(LTRIM(RTRIM(MAX(ES.[NameOstan]))), N''),
                                 NULLIF(LTRIM(RTRIM(MAX(C.[Name]))), N''),
                                 MAX(C.[FullName]), CONVERT(NVARCHAR(20), ES.[Ostan])), 1500),
                   'province'
            FROM [Entekhabat].[EntekhabatSavabegh] AS ES
            LEFT JOIN [dbo].[Citys] AS C ON C.[CityId] = ES.[Ostan]
            WHERE ES.[CodeEntekhabat] = @CodeEntekhabat
              AND ES.[Ostan] IS NOT NULL
            GROUP BY ES.[Ostan];
        END
        ELSE IF @AccessType = 2
        BEGIN
            INSERT INTO #Locations ([LocationId], [ParentId], [ProvinceId], [LocationName], [LocationType])
            SELECT CONVERT(VARCHAR(20), ES.[CodeHozeh]), NULL, CONVERT(VARCHAR(20), @CurrentMahal),
                   LEFT(COALESCE(NULLIF(LTRIM(RTRIM(MAX(ES.[NameHozeh]))), N''), CONCAT(N'حوزه ', ES.[CodeHozeh])), 1500),
                   'district'
            FROM [Entekhabat].[EntekhabatSavabegh] AS ES
            WHERE ES.[CodeEntekhabat] = @CodeEntekhabat
              AND ES.[Ostan] = @CurrentMahal
              AND ES.[CodeHozeh] IS NOT NULL
            GROUP BY ES.[CodeHozeh];
        END
        ELSE
        BEGIN
            -- کاربر حوزه فقط نود حوزه خودش را می‌بیند؛ ارتباط محل کاربر با حوزه از MarkazHozeh است.
            INSERT INTO #Locations ([LocationId], [ParentId], [ProvinceId], [LocationName], [LocationType])
            SELECT CONVERT(VARCHAR(20), ES.[CodeHozeh]), NULL, CONVERT(VARCHAR(20), ES.[Ostan]),
                   LEFT(COALESCE(NULLIF(LTRIM(RTRIM(MAX(ES.[NameHozeh]))), N''),
                                 NULLIF(LTRIM(RTRIM(MAX(H.[NameHozeh]))), N''),
                                 CONCAT(N'حوزه ', ES.[CodeHozeh])), 1500),
                   'district'
            FROM [Entekhabat].[EntekhabatHozeh] AS H
            INNER JOIN [Entekhabat].[EntekhabatSavabegh] AS ES
                ON ES.[CodeEntekhabat] = H.[CodeEntekhabat]
               AND ES.[Ostan] = H.[Ostan]
               AND ES.[CodeHozeh] = H.[CodeHozeh]
            WHERE H.[CodeEntekhabat] = @CodeEntekhabat
              AND H.[MarkazHozeh] = @CurrentMahal
            GROUP BY ES.[Ostan], ES.[CodeHozeh];
        END;
    END
    ELSE
    BEGIN
        INSERT INTO #Locations ([LocationId], [ParentId], [ProvinceId], [LocationName], [LocationType])
        SELECT CONVERT(VARCHAR(20), ES.[CodeHozeh]), CONVERT(VARCHAR(20), @ParentOstan), CONVERT(VARCHAR(20), @ParentOstan),
               LEFT(COALESCE(NULLIF(LTRIM(RTRIM(MAX(ES.[NameHozeh]))), N''), CONCAT(N'حوزه ', ES.[CodeHozeh])), 1500),
               'district'
        FROM [Entekhabat].[EntekhabatSavabegh] AS ES
        WHERE ES.[CodeEntekhabat] = @CodeEntekhabat
          AND ES.[Ostan] = @ParentOstan
          AND ES.[CodeHozeh] IS NOT NULL
        GROUP BY ES.[CodeHozeh];
    END;

    SELECT [LocationId], [ParentId], [ProvinceId], [LocationName], [LocationType]
    FROM #Locations
    ORDER BY CASE [LocationType] WHEN 'headquarters' THEN 1 WHEN 'province' THEN 2 ELSE 3 END, [LocationName];
END;
GO

CREATE OR ALTER PROCEDURE [Davtalab].[SP_Ashkhas_List]
    @CurrentMahal INT,
    @CodeEntekhabat BIGINT,
    @LocationType VARCHAR(20),
    @LocationId INT = NULL,
    @ProvinceId INT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 15,
    @SearchText NVARCHAR(250) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SET @PageNumber = CASE WHEN @PageNumber < 1 THEN 1 ELSE @PageNumber END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 15 WHEN @PageSize > 100 THEN 100 ELSE @PageSize END;
    SET @SearchText = NULLIF(LTRIM(RTRIM(@SearchText)), N'');

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Entekhabat].[EntekhabatActive]
        WHERE [Mahal] = @CurrentMahal
          AND [CodeEntekhabat] = @CodeEntekhabat
    )
        THROW 51107, N'این دوره انتخابات برای محل کاربر فعال نیست.', 1;

    DECLARE @AccessType TINYINT = CASE
        WHEN @CurrentMahal = 1 THEN 1
        WHEN EXISTS (SELECT 1 FROM [dbo].[Citys] WHERE [CityId] = @CurrentMahal AND [PCityId] = 1) THEN 2
        WHEN EXISTS (SELECT 1 FROM [dbo].[Citys] WHERE [CityId] = @CurrentMahal AND [IsHoze] = 1 AND [CityIdHozeh] = [CityId]) THEN 3
        ELSE 0 END;
    DECLARE @AccessProvince INT = NULL, @AccessCodeHozeh INT = NULL;
    IF @AccessType = 3
        SELECT TOP (1) @AccessProvince = H.[Ostan], @AccessCodeHozeh = H.[CodeHozeh]
        FROM [Entekhabat].[EntekhabatHozeh] AS H
        WHERE H.[CodeEntekhabat] = @CodeEntekhabat AND H.[MarkazHozeh] = @CurrentMahal
        ORDER BY H.[ID];

    IF @AccessType = 0 OR (@AccessType = 3 AND @AccessCodeHozeh IS NULL)
        THROW 51102, N'سطح محل کاربر برای این دوره انتخابات معتبر نیست.', 1;
    IF @LocationType NOT IN ('headquarters', 'province', 'district')
        THROW 51103, N'نوع محل انتخاب‌شده معتبر نیست.', 1;
    IF @LocationType = 'headquarters' AND @AccessType <> 1
        THROW 51104, N'دسترسی به فهرست کشوری مجاز نیست.', 1;
    IF @LocationType = 'province' AND (@LocationId IS NULL OR @AccessType <> 1)
        THROW 51105, N'دسترسی به استان انتخاب‌شده مجاز نیست.', 1;
    IF @LocationType = 'district' AND
       (@LocationId IS NULL OR @ProvinceId IS NULL
        OR (@AccessType = 2 AND @ProvinceId <> @CurrentMahal)
        OR (@AccessType = 3 AND (@ProvinceId <> @AccessProvince OR @LocationId <> @AccessCodeHozeh)))
        THROW 51106, N'دسترسی به حوزه انتخابیه مجاز نیست.', 1;

    ;WITH ElectionHistory AS
    (
        SELECT ES.*,
               ROW_NUMBER() OVER (PARTITION BY ES.[ShomarehParvandeh] ORDER BY ES.[ID] DESC) AS [RowNumber]
        FROM [Entekhabat].[EntekhabatSavabegh] AS ES
        WHERE ES.[CodeEntekhabat] = @CodeEntekhabat
    ), CandidateScope AS
    (
        SELECT A.[ShomarehParvandeh], A.[CodeMelli], A.[FirstName], A.[LastName], A.[NamePedar],
               A.[TarikhTavalod], A.[TelHamrah], A.[Jensiyat], A.[Taahol], A.[IsLife], A.[IsRohani],
               H.[Ostan], H.[NameOstan], H.[CodeHozeh], H.[NameHozeh], H.[Natije], H.[Natije_NameFarsi]
        FROM [Davtalab].[Ashkhas] AS A
        INNER JOIN ElectionHistory AS H ON H.[ShomarehParvandeh] = A.[ShomarehParvandeh] AND H.[RowNumber] = 1
        WHERE ISNULL(A.[IsDelete], 0) = 0
          AND (@AccessType = 1
               OR (@AccessType = 2 AND H.[Ostan] = @CurrentMahal)
               OR (@AccessType = 3 AND H.[Ostan] = @AccessProvince AND H.[CodeHozeh] = @AccessCodeHozeh))
          AND (@LocationType = 'headquarters'
               OR (@LocationType = 'province' AND H.[Ostan] = @LocationId)
               OR (@LocationType = 'district' AND H.[Ostan] = @ProvinceId AND H.[CodeHozeh] = @LocationId))
          AND (@SearchText IS NULL
               OR A.[FirstName] LIKE N'%' + @SearchText + N'%'
               OR A.[LastName] LIKE N'%' + @SearchText + N'%'
               OR LTRIM(RTRIM(A.[CodeMelli])) LIKE N'%' + @SearchText + N'%'
               OR CONVERT(VARCHAR(20), A.[ShomarehParvandeh]) LIKE '%' + CONVERT(VARCHAR(250), @SearchText) + '%')
    )
    SELECT CONVERT(VARCHAR(20), [ShomarehParvandeh]) AS [ShomarehParvandeh], RTRIM([CodeMelli]) AS [CodeMelli],
           [FirstName], [LastName], [NamePedar], RTRIM([TarikhTavalod]) AS [TarikhTavalod], RTRIM([TelHamrah]) AS [TelHamrah],
           [Jensiyat], [Taahol], [IsLife], [IsRohani], [Ostan], [NameOstan], [CodeHozeh], [NameHozeh], [Natije], [Natije_NameFarsi]
    FROM CandidateScope
    ORDER BY [LastName], [FirstName], [ShomarehParvandeh]
    OFFSET (@PageNumber - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    ;WITH ElectionHistory AS
    (
        SELECT ES.*,
               ROW_NUMBER() OVER (PARTITION BY ES.[ShomarehParvandeh] ORDER BY ES.[ID] DESC) AS [RowNumber]
        FROM [Entekhabat].[EntekhabatSavabegh] AS ES
        WHERE ES.[CodeEntekhabat] = @CodeEntekhabat
    )
    SELECT COUNT_BIG(1) AS [TotalCount]
    FROM [Davtalab].[Ashkhas] AS A
    INNER JOIN ElectionHistory AS H ON H.[ShomarehParvandeh] = A.[ShomarehParvandeh] AND H.[RowNumber] = 1
    WHERE ISNULL(A.[IsDelete], 0) = 0
      AND (@AccessType = 1
           OR (@AccessType = 2 AND H.[Ostan] = @CurrentMahal)
           OR (@AccessType = 3 AND H.[Ostan] = @AccessProvince AND H.[CodeHozeh] = @AccessCodeHozeh))
      AND (@LocationType = 'headquarters'
           OR (@LocationType = 'province' AND H.[Ostan] = @LocationId)
           OR (@LocationType = 'district' AND H.[Ostan] = @ProvinceId AND H.[CodeHozeh] = @LocationId))
      AND (@SearchText IS NULL
           OR A.[FirstName] LIKE N'%' + @SearchText + N'%'
           OR A.[LastName] LIKE N'%' + @SearchText + N'%'
           OR LTRIM(RTRIM(A.[CodeMelli])) LIKE N'%' + @SearchText + N'%'
           OR CONVERT(VARCHAR(20), A.[ShomarehParvandeh]) LIKE '%' + CONVERT(VARCHAR(250), @SearchText) + '%');
END;
GO
