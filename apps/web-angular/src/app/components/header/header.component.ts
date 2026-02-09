import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../services/i18n.service';
import { UserService } from '../../services/user.service';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../register/register.component';
import { LucideAngularModule, Keyboard, BookOpen, Activity, Trophy, Flame, User, LogIn, Save, LogOut } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    LoginComponent,
    RegisterComponent,
    LucideAngularModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  readonly icons = { Keyboard, BookOpen, Activity, Trophy, Flame, User, LogIn, Save, LogOut };
  i18n = inject(I18nService);
  userService = inject(UserService);
  currentUser$ = this.userService.currentUser$;

  showLogin = false;
  showRegister = false;

  showLoginModal() {
    this.showLogin = true;
    this.showRegister = false;
  }

  showRegisterModal() {
    this.showRegister = true;
    this.showLogin = false;
  }

  closeModals() {
    this.showLogin = false;
    this.showRegister = false;
  }

  async onLogout() {
    await this.userService.logout();
  }
}

