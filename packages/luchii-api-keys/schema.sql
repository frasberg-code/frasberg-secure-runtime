CREATE TABLE api_keys (
    id UUID PRIMARY KEY,

    owner_id UUID NOT NULL,
    workspace_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,

    key_prefix VARCHAR(32) NOT NULL,

    key_hash TEXT NOT NULL UNIQUE,

    status VARCHAR(32) NOT NULL
    CHECK (
        status IN (
            'active',
            'disabled',
            'suspended'
        )
    ),

    permissions JSONB NOT NULL,

    quota_tokens BIGINT DEFAULT 0,

    used_tokens BIGINT DEFAULT 0,

    requests_today BIGINT DEFAULT 0,

    last_used_at TIMESTAMP NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
