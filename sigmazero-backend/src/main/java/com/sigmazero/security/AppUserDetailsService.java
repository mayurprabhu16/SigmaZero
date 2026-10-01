package com.sigmazero.security;

import com.sigmazero.domain.entity.AppUser;
import com.sigmazero.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {
    private final AppUserRepository repository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AppUser user = repository.findByEmailIgnoreCase(email)
                .filter(AppUser::getActive)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new AppUserPrincipal(user.getId(), user.getEmail(), user.getPasswordHash(),
                user.getTenant().getId(), user.getRole());
    }
}
