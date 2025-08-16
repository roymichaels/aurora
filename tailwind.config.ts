import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
                extend: {
                        colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
                        borderRadius: {
                                lg: 'var(--radius-lg)',
                                md: 'var(--radius-md)',
                                sm: 'var(--radius-sm)'
                        },
                        transitionTimingFunction: {
                                standard: 'var(--ease-standard)'
                        },
                        transitionDuration: {
                                fast: 'var(--duration-fast)',
                                slow: 'var(--duration-slow)'
                        },
                        keyframes: {
                                'accordion-down': {
                                        from: { height: '0', opacity: '0' },
                                        to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
                                },
                                'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
					to: { height: '0', opacity: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-out': {
					'0%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0', transform: 'translateY(10px)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'scale-out': {
					from: { transform: 'scale(1)', opacity: '1' },
					to: { transform: 'scale(0.95)', opacity: '0' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-out-right': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(100%)' }
				}
			},
                        animation: {
                                'accordion-down': 'accordion-down var(--duration-fast) var(--ease-standard)',
                                'accordion-up': 'accordion-up var(--duration-fast) var(--ease-standard)',
                                'fade-in': 'fade-in var(--duration-slow) var(--ease-standard)',
                                'fade-out': 'fade-out var(--duration-slow) var(--ease-standard)',
                                'scale-in': 'scale-in var(--duration-fast) var(--ease-standard)',
                                'scale-out': 'scale-out var(--duration-fast) var(--ease-standard)',
                                'slide-in-right': 'slide-in-right var(--duration-slow) var(--ease-standard)',
                                'slide-out-right': 'slide-out-right var(--duration-slow) var(--ease-standard)',
                                // Combined
                                'enter': 'fade-in var(--duration-slow) var(--ease-standard), scale-in var(--duration-fast) var(--ease-standard)',
                                'exit': 'fade-out var(--duration-slow) var(--ease-standard), scale-out var(--duration-fast) var(--ease-standard)'
                        }
                }
        },
        plugins: [require("tailwindcss-animate")],
} satisfies Config;
