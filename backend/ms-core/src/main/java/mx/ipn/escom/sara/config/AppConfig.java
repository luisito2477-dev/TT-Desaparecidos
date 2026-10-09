package mx.ipn.escom.sara.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class AppConfig {

    /**
     * Cliente HTTP para comunicarse con MS-IA.
     *
     * Se usa el RestClient.Builder de Spring Boot para heredar la configuracion
     * de Jackson (fechas LocalDate, etc.). La URL y los tiempos se leen de
     * application.properties para poder cambiarlos en Docker sin recompilar.
     */
    @Bean
    public RestClient iaRestClient() {
        /*
         * Configuracion que define como se construye la instancia del cliente HTTP
         * esta instancia objeto se registra como Bean Global
         * */

        final String MS_IA_BASE_URL = "http://localhost:8000";

        //configurar la fabrica de peticiones con timeouts

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis()); //Tiempo max para conectar
        factory.setReadTimeout((int) Duration.ofSeconds(30).toMillis());  //tiempo max para esperar response

        //construyendo y devolviendo el bean
        return RestClient.builder()
                .baseUrl(MS_IA_BASE_URL)
                .requestFactory(factory)
                .build();
    }
}
