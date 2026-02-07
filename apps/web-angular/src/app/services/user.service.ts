import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly storageKey = 'tcl_user_id';

  getUserId(): string {
    let userId = localStorage.getItem(this.storageKey);
    if (!userId) {
      userId = this.generateId();
      localStorage.setItem(this.storageKey, userId);
    }
    return userId;
  }

  private generateId(): string {
    return 'user-' + crypto.randomUUID();
  }
}
