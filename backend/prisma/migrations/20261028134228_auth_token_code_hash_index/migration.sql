-- CreateIndex
CREATE INDEX "auth_tokens_type_code_hash_idx" ON "auth_tokens"("type", "code_hash");
