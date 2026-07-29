// This allows to utilize named imports, as well as default imports.
declare module '*.module.css';

// This allows to utilize only default imports.
declare module '*.css' {
    const classes: { readonly [key: string]: string };
    export = classes;
}
