package ru.ruc.lk.ruk_lk_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

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
            // публичные эндпоинты
            .requestMatchers("/api/health").permitAll()
            // auth: сессия в HttpSession, не в Spring Security Authentication
            .requestMatchers("/api/auth/**").permitAll()
            // остальное API — позже; пока тоже через сессию в контроллерах
            .anyRequest().permitAll()
            );

     return http.build();

    }
}