-- Create "point_types" table
CREATE TABLE "point_types" ("code" text NOT NULL, "label" text NOT NULL, PRIMARY KEY ("code"));
-- Create "point_accounts" table
CREATE TABLE "point_accounts" ("user_id" text NOT NULL, "point_type" text NOT NULL, "balance" bigint NOT NULL DEFAULT 0, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, PRIMARY KEY ("user_id", "point_type"), CONSTRAINT "point_accounts_point_type_fkey" FOREIGN KEY ("point_type") REFERENCES "point_types" ("code") ON UPDATE NO ACTION ON DELETE NO ACTION, CONSTRAINT "point_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, CONSTRAINT "point_accounts_balance_check" CHECK (balance >= 0));
-- Create "point_ledger" table
CREATE TABLE "point_ledger" ("id" text NOT NULL, "user_id" text NOT NULL, "point_type" text NOT NULL, "amount" bigint NOT NULL, "type" text NOT NULL, "reason" text NOT NULL, "source_type" text NOT NULL, "source_id" text NOT NULL, "balance_after" bigint NOT NULL, "created_at" timestamptz NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "point_ledger_point_type_fkey" FOREIGN KEY ("point_type") REFERENCES "point_types" ("code") ON UPDATE NO ACTION ON DELETE NO ACTION, CONSTRAINT "point_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, CONSTRAINT "point_ledger_amount_check" CHECK (amount <> 0), CONSTRAINT "point_ledger_balance_after_check" CHECK (balance_after >= 0), CONSTRAINT "point_ledger_check" CHECK (((type = 'earn'::text) AND (amount > 0)) OR ((type = 'spend'::text) AND (amount < 0)) OR (type = 'adjust'::text)), CONSTRAINT "point_ledger_reason_check" CHECK (length(reason) > 0), CONSTRAINT "point_ledger_source_id_check" CHECK (length(source_id) > 0), CONSTRAINT "point_ledger_source_type_check" CHECK (length(source_type) > 0), CONSTRAINT "point_ledger_type_check" CHECK (type = ANY (ARRAY['earn'::text, 'spend'::text, 'adjust'::text])));
-- Create index "point_ledger_source_idx" to table: "point_ledger"
CREATE INDEX "point_ledger_source_idx" ON "point_ledger" ("source_type", "source_id");
-- Create index "point_ledger_user_id_created_at_idx" to table: "point_ledger"
CREATE INDEX "point_ledger_user_id_created_at_idx" ON "point_ledger" ("user_id", "point_type", "created_at" DESC);
-- Drop "contribution_point_accounts" table
DROP TABLE "contribution_point_accounts";
-- Drop "contribution_point_ledger" table
DROP TABLE "contribution_point_ledger";
