USE [DBEntekhabat];
GO

CREATE OR ALTER PROCEDURE [Security].[SP_Posts_List]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [PostId], [OnvanPost], [TypeMahal]
    FROM [Security].[Posts]
    ORDER BY [TypeMahal], [OnvanPost];
END;
GO

CREATE OR ALTER PROCEDURE [Security].[SP_Posts_Insert]
    @OnvanPost NVARCHAR(150),
    @TypeMahal TINYINT
AS
BEGIN
    SET NOCOUNT ON;
    SET @OnvanPost = NULLIF(LTRIM(RTRIM(@OnvanPost)), N'');
    IF @OnvanPost IS NULL THROW 51030, N'عنوان سمت الزامی است.', 1;
    IF @TypeMahal NOT BETWEEN 1 AND 4 THROW 51031, N'سطح محل معتبر نیست.', 1;
    IF EXISTS (SELECT 1 FROM [Security].[Posts] WHERE [OnvanPost] = @OnvanPost AND [TypeMahal] = @TypeMahal)
        THROW 51032, N'این سمت برای سطح انتخاب‌شده قبلاً ثبت شده است.', 1;
    INSERT INTO [Security].[Posts] ([OnvanPost], [TypeMahal]) VALUES (@OnvanPost, @TypeMahal);
    SELECT CONVERT(INT, SCOPE_IDENTITY()) AS [PostId];
END;
GO

CREATE OR ALTER PROCEDURE [Security].[SP_Posts_Update]
    @PostId INT,
    @OnvanPost NVARCHAR(150),
    @TypeMahal TINYINT
AS
BEGIN
    SET NOCOUNT ON;
    SET @OnvanPost = NULLIF(LTRIM(RTRIM(@OnvanPost)), N'');
    IF @OnvanPost IS NULL THROW 51030, N'عنوان سمت الزامی است.', 1;
    IF @TypeMahal NOT BETWEEN 1 AND 4 THROW 51031, N'سطح محل معتبر نیست.', 1;
    IF NOT EXISTS (SELECT 1 FROM [Security].[Posts] WHERE [PostId] = @PostId) THROW 51033, N'سمت موردنظر پیدا نشد.', 1;
    IF EXISTS (SELECT 1 FROM [Security].[Posts] WHERE [OnvanPost] = @OnvanPost AND [TypeMahal] = @TypeMahal AND [PostId] <> @PostId)
        THROW 51032, N'این سمت برای سطح انتخاب‌شده قبلاً ثبت شده است.', 1;
    UPDATE [Security].[Posts] SET [OnvanPost] = @OnvanPost, [TypeMahal] = @TypeMahal WHERE [PostId] = @PostId;
END;
GO

CREATE OR ALTER PROCEDURE [Security].[SP_Posts_Delete]
    @PostId INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM [Security].[Users] WHERE [PostId] = @PostId)
        THROW 51034, N'این سمت به کاربر تخصیص داده شده و قابل حذف نیست.', 1;
    DELETE FROM [Security].[Posts] WHERE [PostId] = @PostId;
    IF @@ROWCOUNT = 0 THROW 51033, N'سمت موردنظر پیدا نشد.', 1;
END;
GO
