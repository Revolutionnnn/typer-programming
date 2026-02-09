import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
    @Output() loginSuccess = new EventEmitter<void>();
    @Output() closeModal = new EventEmitter<void>();
    @Output() switchToRegister = new EventEmitter<void>();

    username = '';
    password = '';
    error = '';
    loading = false;

    constructor(private userService: UserService) { }

    async onSubmit() {
        if (!this.username || !this.password) {
            this.error = 'Username and password are required';
            return;
        }

        this.loading = true;
        this.error = '';

        try {
            await this.userService.login(this.username, this.password);
            // Successfully logged in - emit success event
            this.loginSuccess.emit();
        } catch (err: any) {
            this.error = err.error?.error || 'Invalid credentials';
        } finally {
            this.loading = false;
        }
    }

    onClose() {
        this.closeModal.emit();
    }

    onSwitchToRegister() {
        this.switchToRegister.emit();
    }
}
