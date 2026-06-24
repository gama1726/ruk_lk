package ru.ruc.lk.ruk_lk_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
            //для rest-api пока отключим csrf
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {}) //подхватит бин CorsConfig.corsConfigurationSource()

            //отключаем базово. форму для логина spring security
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .authorizeHttpRequests(auth -> auth
            //открытые эндпоинты
            .requestMatchers("/api/health").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
            //все остальные только с сессией будут жоступны
            .anyRequest().authenticated()
            );

     return http.build();

    }
}