package ru.ruc.lk.ruk_lk_api.integration.max;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;

@ExtendWith(MockitoExtension.class)
class MaxBindingServicePhoneMatchTest {

    @Mock
    private StudentMaxBindingRepository bindingRepository;
    @Mock
    private MaxBindTokenRepository tokenRepository;
    @Mock
    private VerificationMaxSender maxSender;
    @Mock
    private ObjectProvider<MaxBotIdentity> botIdentity;
    @Mock
    private ObjectProvider<MaxOutboundMessages> outboundMessages;

    private MaxProperties properties;
    private MaxBindingService service;

    @BeforeEach
    void setUp() {
        properties = new MaxProperties();
        properties.setRequirePhoneMatch(true);
        service = new MaxBindingService(
            bindingRepository,
            tokenRepository,
            maxSender,
            properties,
            botIdentity,
            outboundMessages,
            new MaxContactVerifier()
        );
    }

    @Test
    void keepsBindingWhenPhoneStillMatches() {
        StudentMaxBinding binding = new StudentMaxBinding("858554", 243243600L, Instant.now(), "9161234567");
        when(bindingRepository.findById("858554")).thenReturn(Optional.of(binding));

        MaxBindingService.BindingResolution result =
            service.resolveBindingForLogin("858554", "+7 (916) 123-45-67");

        assertEquals(Optional.of(243243600L), result.maxUserId());
        assertFalse(result.phoneChanged());
        verify(bindingRepository, never()).delete(binding);
        verify(maxSender, never()).sendMessage(anyLong(), anyString());
    }

    @Test
    void dropsBindingAndNotifiesWhenOneCPhoneChanged() {
        StudentMaxBinding binding = new StudentMaxBinding("858554", 243243600L, Instant.now(), "9161234567");
        when(bindingRepository.findById("858554")).thenReturn(Optional.of(binding));

        MaxBindingService.BindingResolution result =
            service.resolveBindingForLogin("858554", "9991112233");

        assertTrue(result.maxUserId().isEmpty());
        assertTrue(result.phoneChanged());
        verify(bindingRepository).delete(binding);
        verify(bindingRepository).flush();
        verify(maxSender).sendMessage(eq(243243600L), contains("изменился"));
    }

    @Test
    void backfillsLegacyBindingWithoutStoredPhone() {
        StudentMaxBinding binding = new StudentMaxBinding("858554", 243243600L, Instant.now(), null);
        when(bindingRepository.findById("858554")).thenReturn(Optional.of(binding));

        MaxBindingService.BindingResolution result =
            service.resolveBindingForLogin("858554", "9161234567");

        assertEquals(Optional.of(243243600L), result.maxUserId());
        assertFalse(result.phoneChanged());
        assertEquals("9161234567", binding.getVerifiedPhoneNorm());
        verify(bindingRepository).save(binding);
        verify(bindingRepository, never()).delete(binding);
    }
}
