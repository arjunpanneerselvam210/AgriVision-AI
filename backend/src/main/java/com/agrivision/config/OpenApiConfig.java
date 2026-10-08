package com.agrivision.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("AgriVision AI - Agricultural Satellite Intelligence API")
                        .version("1.0.0")
                        .description("Backend REST API for Mapathon Problem Statement 1: " +
                                "Agricultural Land Parcel and Crop Identification (Paddy vs. Banana vs. Other) " +
                                "in Tirunelveli District (Ambasamudram & Cheranmahadevi Taluks), Tamil Nadu.")
                        .contact(new Contact()
                                .name("AgriVision AI Geospatial Intelligence Team")
                                .email("contact@agrivision.ai"))
                        .license(new License().name("Apache 2.0").url("https://springdoc.org")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Provide JWT access token obtained from /api/auth/login")));
    }
}
