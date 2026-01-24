<script lang="ts">
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<main class="flex min-h-screen flex-col items-center justify-center bg-base-200 p-4">
	<div class="hero w-full max-w-4xl overflow-hidden rounded-box bg-base-100 shadow-xl">
		<div class="hero-content flex-col p-0 lg:flex-row-reverse">
			<div class="flex h-full w-full items-center justify-center bg-primary/10 p-10 lg:w-1/2">
				<i class="bi bi-graph-up-arrow text-9xl text-primary opacity-80"></i>
			</div>
			<div class="w-full p-8 lg:w-1/2 lg:p-12">
				<h1 class="mb-6 text-5xl font-bold text-base-content">GraphQL Explorer</h1>
				<p class="py-6 text-lg text-base-content/70">
					Explore, visualize, and interact with your GraphQL data. Connect to any endpoint or use
					our demo APIs to see it in action.
				</p>
				<ul class="mb-8 space-y-3 text-base-content/80">
					<li class="flex items-center gap-2">
						<i class="bi bi-check-circle-fill text-success"></i> Visual Data Exploration
					</li>
					<li class="flex items-center gap-2">
						<i class="bi bi-check-circle-fill text-success"></i> Multiple Endpoint Support
					</li>
					<li class="flex items-center gap-2">
						<i class="bi bi-check-circle-fill text-success"></i> Local Storage Persistence
					</li>
				</ul>
				<div class="flex gap-4">
					<a href="/endpoints" class="btn gap-2 btn-lg btn-primary">
						Get Started <i class="bi bi-arrow-right"></i>
					</a>
					<a
						href="https://github.com/files-community/GraphboarderWithSvelte5"
						target="_blank"
						class="btn btn-ghost btn-lg"
					>
						<i class="bi bi-github"></i> GitHub
					</a>
				</div>
			</div>
		</div>
	</div>
</main>
