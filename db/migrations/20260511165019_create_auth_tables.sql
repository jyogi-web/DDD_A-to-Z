-- Create "users" table
CREATE TABLE "users" ("id" text NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, PRIMARY KEY ("id"));
-- Create "github_accounts" table
CREATE TABLE "github_accounts" ("github_id" bigint NOT NULL, "user_id" text NOT NULL, "username" text NOT NULL, "avatar_url" text NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, PRIMARY KEY ("github_id"), CONSTRAINT "github_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION);

-- Create "sessions" table
CREATE TABLE "sessions" ("token_hash" text NOT NULL, "user_id" text NOT NULL, "expires_at" timestamptz NOT NULL, "created_at" timestamptz NOT NULL, PRIMARY KEY ("token_hash"), CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION);

-- Create index "sessions_expires_at_idx" to table: "sessions"
CREATE INDEX "sessions_expires_at_idx" ON "sessions" ("expires_at");

-- Create index "sessions_user_id_idx" to table: "sessions"
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");
