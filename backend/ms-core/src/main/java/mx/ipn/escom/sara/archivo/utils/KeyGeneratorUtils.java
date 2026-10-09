package mx.ipn.escom.sara.archivo.utils;

import org.springframework.stereotype.Component;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;

@Component("keyUtil")
public class KeyGeneratorUtils {
    public static String hashPayload(String payload){
        /*
        Convierte cualquier string (sin importar la longitud) a un string  MD5 de longitud fija
         */
        if(payload == null){
            return "null";
        }
        return DigestUtils.md5DigestAsHex(payload.getBytes(StandardCharsets.UTF_8));
    }
}
