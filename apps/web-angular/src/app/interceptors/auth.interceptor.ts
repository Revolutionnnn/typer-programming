import { HttpInterceptorFn } from '@angular/common/http';

/**
 * HTTP interceptor that adds credentials to all requests
 * This ensures cookies are sent with API calls
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Clone request and add withCredentials option
    const authReq = req.clone({
        withCredentials: true,
    });

    return next(authReq);
};
