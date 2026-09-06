package mx.ipn.escom.sara.archivo.service;

import lombok.AllArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class RedisService {

    private final RedisTemplate redisTemplate;




}
