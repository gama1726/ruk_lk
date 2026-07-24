package ru.ruc.lk.ruk_lk_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        StudentSessionAuthFilter studentSessionAuthFilter
    ) throws Exception {
        http
            // Cookie-сессия + SameSite=lax; полный CSRF-токен для SPA — отдельно
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/max/webhook").permitAll()
                .requestMatchers("/api/admin/**").permitAll()
                // /api/student/** — StudentSessionAuthFilter + requireStudent в сервисах
                .anyRequest().permitAll()
            )
            .addFilterBefore(studentSessionAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
