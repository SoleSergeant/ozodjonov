import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { r as setOnSetGetEnv, t as getEnv$1 } from "./runtime_x1Na2qzi.mjs";
import { makeGenericAPIRouteHandler } from "@keystatic/core/api/generic";
import { collection, config, fields, singleton } from "@keystatic/core";
//#region \0astro:env/server
/** @returns {string} */
var getEnv = (key) => {
	return getEnv$1(key);
};
var getSecret = (key) => {
	return getEnv(key);
};
setOnSetGetEnv(() => {});
//#endregion
//#region node_modules/@keystatic/astro/dist/keystatic-astro-api.js
function makeHandler(_config) {
	return async function keystaticAPIRoute(context) {
		var _config$clientId, _config$clientSecret, _config$secret;
		const { body, headers, status } = await makeGenericAPIRouteHandler({
			..._config,
			clientId: (_config$clientId = _config.clientId) !== null && _config$clientId !== void 0 ? _config$clientId : getSecret("KEYSTATIC_GITHUB_CLIENT_ID"),
			clientSecret: (_config$clientSecret = _config.clientSecret) !== null && _config$clientSecret !== void 0 ? _config$clientSecret : getSecret("KEYSTATIC_GITHUB_CLIENT_SECRET"),
			secret: (_config$secret = _config.secret) !== null && _config$secret !== void 0 ? _config$secret : getSecret("KEYSTATIC_SECRET")
		}, { slugEnvName: "PUBLIC_KEYSTATIC_GITHUB_APP_SLUG" })(context.request);
		return new Response(body, {
			status,
			headers
		});
	};
}
//#endregion
//#region keystatic.config.ts
var keystatic_config_default = config({
	storage: {
		kind: "github",
		repo: "SoleSergeant/ozodjonov"
	},
	ui: {
		brand: { name: "Muhammadjon." },
		navigation: {
			Writing: ["blog"],
			Movies: [
				"diary",
				"collections",
				"actors"
			],
			Settings: ["site"]
		}
	},
	collections: {
		blog: collection({
			label: "Blog posts",
			slugField: "title",
			path: "src/content/blog/*",
			format: { contentField: "content" },
			entryLayout: "content",
			columns: ["title", "date"],
			schema: {
				title: fields.slug({ name: { label: "Title" } }),
				description: fields.text({
					label: "Description",
					description: "One sentence shown in previews.",
					multiline: true
				}),
				date: fields.date({
					label: "Date",
					defaultValue: { kind: "today" },
					validation: { isRequired: true }
				}),
				tags: fields.array(fields.text({ label: "Tag" }), {
					label: "Tags",
					itemLabel: (p) => p.value
				}),
				draft: fields.checkbox({
					label: "Draft",
					description: "Drafts are hidden on the live site.",
					defaultValue: false
				}),
				content: fields.markdoc({
					label: "Content",
					extension: "md"
				})
			}
		}),
		diary: collection({
			label: "Film diary (by year)",
			slugField: "year",
			path: "src/content/diary/*",
			format: { data: "json" },
			schema: {
				year: fields.slug({ name: {
					label: "Year",
					description: "The year you watched these, e.g. 2027."
				} }),
				films: fields.array(fields.object({
					title: fields.text({
						label: "Title",
						validation: { isRequired: true }
					}),
					released: fields.integer({
						label: "Release year",
						description: "Helps find the right poster."
					}),
					rewatch: fields.checkbox({ label: "Rewatch" }),
					uzbek: fields.checkbox({ label: "Uzbek cinema" }),
					series: fields.checkbox({ label: "Series" }),
					reflection: fields.relationship({
						label: "Reflection",
						description: "A blog post about this film. Adds a \"Read reflection\" link to its poster.",
						collection: "blog"
					}),
					search: fields.text({
						label: "Poster search (optional)",
						description: "Only if the poster comes out wrong: the original title to search for instead."
					})
				}), {
					label: "Films, in the order you watched them",
					itemLabel: (p) => `${p.fields.title.value || "New film"}${p.fields.rewatch.value ? " · rewatch" : ""}`
				})
			}
		}),
		collections: collection({
			label: "Collections",
			slugField: "title",
			path: "src/content/collections/*",
			format: { data: "json" },
			columns: ["title", "order"],
			schema: {
				title: fields.slug({ name: { label: "Title" } }),
				kind: fields.select({
					label: "Type",
					options: [{
						label: "Theme",
						value: "theme"
					}, {
						label: "Saga or franchise",
						value: "franchise"
					}],
					defaultValue: "theme"
				}),
				line: fields.text({ label: "Tagline" }),
				order: fields.integer({
					label: "Order",
					description: "Lower numbers show first.",
					defaultValue: 50
				}),
				allUzbek: fields.checkbox({
					label: "Include all Uzbek films automatically",
					description: "Ignores the list below and shows every film marked \"Uzbek cinema\"."
				}),
				films: fields.array(fields.text({
					label: "Film title",
					description: "Must match the title in the diary exactly."
				}), {
					label: "Films",
					itemLabel: (p) => p.value
				})
			}
		}),
		actors: collection({
			label: "Leading men",
			slugField: "name",
			path: "src/content/actors/*",
			format: { data: "json" },
			schema: {
				name: fields.slug({ name: { label: "Name" } }),
				note: fields.text({
					label: "Why they matter to you",
					multiline: true
				}),
				films: fields.array(fields.text({
					label: "Film title",
					description: "Must match the title in the diary exactly."
				}), {
					label: "Films",
					itemLabel: (p) => p.value
				})
			}
		})
	},
	singletons: { site: singleton({
		label: "Site settings",
		path: "src/content/site",
		format: { data: "json" },
		schema: {
			name: fields.text({
				label: "Short name",
				description: "Shown in the header."
			}),
			fullName: fields.text({ label: "Full name" }),
			tagline: fields.text({
				label: "Tagline",
				description: "Used in search results and link previews."
			}),
			intro: fields.text({
				label: "Homepage intro",
				multiline: true
			}),
			links: fields.array(fields.object({
				label: fields.text({
					label: "Label",
					description: "e.g. Telegram"
				}),
				href: fields.text({
					label: "Link",
					description: "e.g. https://t.me/username or mailto:you@example.com"
				}),
				handle: fields.text({
					label: "Shown as",
					description: "e.g. @username"
				})
			}), {
				label: "Contact links",
				itemLabel: (p) => p.fields.label.value || "New link"
			})
		}
	}) }
});
//#endregion
//#region node_modules/@keystatic/astro/internal/keystatic-api.js
var keystatic_api_exports = /* @__PURE__ */ __exportAll({
	ALL: () => ALL,
	all: () => all,
	prerender: () => false
});
var all = makeHandler({ config: keystatic_config_default });
var ALL = all;
//#endregion
//#region \0virtual:astro:page:node_modules/@keystatic/astro/internal/keystatic-api@_@js
var page = () => keystatic_api_exports;
//#endregion
export { page };
