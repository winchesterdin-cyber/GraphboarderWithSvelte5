/**
 * Navigation configuration for improved information architecture.
 */
export interface NavItem {
	label: string;
	href: string;
	description: string;
}

export const primaryNavItems: NavItem[] = [
	{ label: 'Endpoints', href: '/endpoints', description: 'Manage GraphQL endpoints' },
	{ label: 'Recent', href: '/endpoints', description: 'Continue recent work quickly' },
	{ label: 'Help', href: '/demo', description: 'Read walkthroughs and usage notes' }
];
