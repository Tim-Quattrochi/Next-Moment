import "server-only"
import { StackServerApp } from "@stackframe/stack"

/**
 * Lazily construct StackServerApp to avoid throwing during build when
 * NEXT_PUBLIC_STACK_PROJECT_ID (and related config) may be unset.
 */
let _stack: StackServerApp | null = null

// Provide a no-op fallback when required env isn't set, to allow builds
const hasStackConfig = Boolean(process.env.NEXT_PUBLIC_STACK_PROJECT_ID)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stackServerApp: any = hasStackConfig
  ? new Proxy(
      {},
      {
        // Lazy initialize when any property is accessed
        get(_target, prop) {
          if (!_stack) {
            _stack = new StackServerApp({
              tokenStore: "nextjs-cookie",
              urls: {
                signIn: "/handler/sign-in",
                afterSignIn: "/app",
                afterSignOut: "/",
              },
            })
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (_stack as any)[prop]
        },
      }
    )
  : {
      // Minimal surface used by our app during build to avoid crashes
      // eslint-disable-next-line @typescript-eslint/require-await
      async getUser() {
        return null
      },
      toClientJson() {
        return {
          urls: {
            signIn: "/handler/sign-in",
            afterSignIn: "/app",
            afterSignOut: "/",
          },
        }
      },
    }
