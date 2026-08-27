USE [DBEntekhabat];
GO

CREATE OR ALTER VIEW [Security].[VW_LoginUsers]
AS
    SELECT
        U.[UserId],
        U.[PersonId],
        P.[CodeMelli],
        U.[Password],
        U.[Mahal],
        U.[PostId],
        P.[FirstName],
        P.[LastName],
        P.[IsActive],
        P.[IsDelete]
    FROM [Security].[Users] AS U
    INNER JOIN [Person].[Persons] AS P
        ON P.[PersonId] = U.[PersonId];
GO
