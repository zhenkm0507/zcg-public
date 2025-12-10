-- 创建用户
CREATE USER zcg WITH PASSWORD 'zcg';

-- 创建数据库
CREATE DATABASE zcg
        WITH 
        OWNER = zcg
        ENCODING = 'UTF8'
        LC_COLLATE = 'en_US.utf8'
        LC_CTYPE = 'en_US.utf8'
        TABLESPACE = pg_default
        CONNECTION LIMIT = -1;   

-- 创建schema（如果不存在）
CREATE SCHEMA IF NOT EXISTS zcg AUTHORIZATION zcg;

-- 授予用户对schema的权限
GRANT ALL ON SCHEMA zcg TO zcg;

-- 授予用户对当前数据库的连接权限
GRANT CONNECT ON DATABASE zcg TO zcg;

-- 授予用户对schema下未来创建的表的使用和选择权限
ALTER DEFAULT PRIVILEGES IN SCHEMA zcg
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO zcg;

-- 授予用户对schema下未来创建的序列的使用权限
ALTER DEFAULT PRIVILEGES IN SCHEMA zcg
GRANT USAGE, SELECT ON SEQUENCES TO zcg;

-- 授予用户对schema下未来创建的函数的执行权限
ALTER DEFAULT PRIVILEGES IN SCHEMA zcg
GRANT EXECUTE ON FUNCTIONS TO zcg;    

GRANT ALL ON DATABASE zcg TO zcg;