import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
    @Output() registerSuccess = new EventEmitter<void>();
    @Output() closeModal = new EventEmitter<void>();
    @Output() switchToLogin = new EventEmitter<void>();

    username = '';
    email = '';
    password = '';
    confirmPassword = '';
    error = '';
    loading = false;
    isConvertingGuest = false;

    constructor(private userService: UserService) {
        this.isConvertingGuest = this.userService.isGuest();
    }

    async onSubmit() {
        // Validation
        if (!this.username || !this.password) {
            this.error = 'Username and password are required';
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.error = 'Passwords do not match';
            return;
        }

        if (this.password.length < 6) {
            this.error = 'Password must be at least 6 characters';
            return;
        }

        this.loading = true;
        this.error = '';

        try {
            await this.userService.register(this.username, this.email, this.password);
            // Successfully registered - emit success event
            this.registerSuccess.emit();
        } catch (err: any) {
            this.error = err.error?.error || 'Registration failed';
        } finally {
            this.loading = false;
        }
    }

    onClose() {
        this.closeModal.emit();
    }

    onSwitchToLogin() {
        this.switchToLogin.emit();
    }
}
