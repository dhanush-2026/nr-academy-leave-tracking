package com.zenbyte.leave.security;
import com.zenbyte.leave.entity.AppUser; import com.zenbyte.leave.repository.AppUserRepository; import org.springframework.security.core.userdetails.*; import org.springframework.stereotype.Service;
@Service public class CustomUserDetailsService implements UserDetailsService {
 private final AppUserRepository repo; public CustomUserDetailsService(AppUserRepository repo){this.repo=repo;}
 public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException { AppUser u=repo.findByUsername(username).orElseThrow(()->new UsernameNotFoundException("User not found")); return User.withUsername(u.getUsername()).password(u.getPassword()).roles(u.getRole().name()).disabled(!u.isActive()).build(); }
}
