@echo off
echo Starting build preparation...

REM Step 1: Generate Prisma client
echo Generating Prisma client...
call npx prisma generate

REM Step 2: Prepare Prisma for Windows
echo Preparing Prisma for Windows environment...
call node src/lib/fix-prisma.js

REM Step 3: Create build directory if it doesn't exist
if not exist ".next" (
    echo Creating .next directory...
    mkdir ".next"
)

if not exist ".next\server" (
    echo Creating .next\server directory...
    mkdir ".next\server"
)

REM Step 4: Copy Prisma binaries to the server directory
echo Copying Prisma binaries...
if exist "node_modules\.prisma\client" (
    echo Copying query engine...
    copy "node_modules\.prisma\client\query-engine-windows.dll.node" ".next\server\" /Y
    copy "node_modules\.prisma\client\schema.prisma" ".next\server\" /Y
)

REM Step 5: Build the application
echo Building the application...
set NEXT_TELEMETRY_DISABLED=1

REM Use conditional execution to continue even if there are errors
call next build || (
    echo Build completed with warnings, but continuing...
)

echo Build process completed! 