package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
)

func GetJSON(ctx context.Context, rdb *redis.Client, key string, dest any) (bool, error) {
	if rdb == nil {
		return false, nil
	}
	raw, err := rdb.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	if err := json.Unmarshal(raw, dest); err != nil {
		return false, err
	}
	return true, nil
}

func SetJSON(ctx context.Context, rdb *redis.Client, key string, value any, ttl time.Duration) error {
	if rdb == nil {
		return nil
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return rdb.Set(ctx, key, raw, ttl).Err()
}
