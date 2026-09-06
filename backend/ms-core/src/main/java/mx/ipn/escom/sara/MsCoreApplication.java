package mx.ipn.escom.sara;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing   //anotacion para que el spring pueda mantener un registro automatico de cuando se crean los registros
public class MsCoreApplication {

	public static void main(String[] args) {

		SpringApplication.run(MsCoreApplication.class, args);
	}

}
