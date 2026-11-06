// @ts-check

import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
	site: 'https://despr0a.github.io/',
	integrations: [mdx(), sitemap()],
	markdown: {
		processor: satteri({
			features: {
				gfm: {
					footnotes: {
						label: '脚注',
						backLabel: '返回正文引用 {reference}',
					},
				},
			},
		}),
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', 'sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
