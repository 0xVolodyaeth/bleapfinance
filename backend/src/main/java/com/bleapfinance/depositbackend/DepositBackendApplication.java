package com.bleapfinance.depositbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.FileNotFoundException;
import java.util.Collections;
import java.util.Vector;

@SpringBootApplication
@RestController
public class DepositBackendApplication {
	public Vector<String> castodialInMemory = new Vector<String>();

	public static void main(String[] args) throws FileNotFoundException {
		SpringApplication app = new SpringApplication(DepositBackendApplication.class);

		app.setDefaultProperties(Collections
				.singletonMap("server.port", "8083"));
		app.run(args);
	}

	@GetMapping("/")
	public String index() {
		return "hello";
	}
}
