export async function runProcess(command: string[], log: boolean = true): Promise<void> {
    const p = Deno.run({
        cmd: command,
        stdout: 'piped',
        stderr: 'piped'
    });
    const {code} = await p.status()
    const rawOutput = await p.output()
    const rawError = await p.stderrOutput()
    if (log) {
        console.log(`command: ${command.join(" ")}`)
        console.log(`subprocess output:\n${new TextDecoder().decode(rawOutput)}`)
    }
    if (code === 0) {
        return
    } else {
        throw new Error(`run command code: ${code}, error: ${new TextDecoder().decode(rawError)}`)
    }
}

export async function listDir(currentPath: string): Promise<string[]> {

    const names: string[] = []

    for (const dirEntry of Deno.readDirSync(currentPath)) {

        const entryPath = `${currentPath}/${dirEntry.name}`
        if (dirEntry.isFile) {
            names.push(entryPath)
        }
    }
    return names
}

export async function download(url: string, destPath: string): Promise<void> {
    const res = await fetch(url);
    if (res.status !== 200) {
        throw new Error(`response status was ${res.status}, this is not handled.`);
    }

    using file = Deno.openSync(destPath, {create: true, write: true, read: true})

    if (res?.body) {
        await res.body.pipeTo(file.writable)
    }
}

type Env = {
    key: string,
    value: string
}

export async function writeToGithubEnv(env: Env[]): Promise<void> {
    const GITHUB_ENV_PATH = Deno.env.get("GITHUB_ENV") ?? ""
    if (GITHUB_ENV_PATH === "") throw new Error("GITHUB_ENV is empty")
    const file = await Deno.open(GITHUB_ENV_PATH, {create: true, write: true, read: true, append: true})
    const encoder = new TextEncoder()
    for (const e of env) {
        await file.write(encoder.encode("\n"))
        await file.write(encoder.encode(`${e.key}=${e.value}`))
    }
    await file.write(encoder.encode("\n"))
    file.close()
}

export function readEnv(key: string): string | undefined {
    const value = Deno.env.get(key)
    return (value === "undefined" || !value) ? undefined : value
}

export const downloadFromGithubLatestRelease = async (repo: string, fileNameRegex: string) => {
    const api = `https://api.github.com/repos/${repo}/releases`
    const releases: Array<GithubRelease> = (await (await fetch(api)).json()).sort((a: GithubRelease, b: GithubRelease) =>
        Date.parse(b.published_at) - Date.parse(a.published_at))
    console.log(`releases: ${releases.map(release => release.tag_name?.trim()).join("\n")}`)


    const latest = releases[0]
    if (!latest) throw new Error("cannot get latest release")

    console.log(`latest: ${JSON.stringify(latest, null, 2)}`)
    const regex = new RegExp(fileNameRegex);
    const asset = latest.assets.find(asset => regex.test(asset.name))
    if (!asset) {
        console.log("can't find asset")
        throw new Error("cannot get latest ttf asset")
    }

    console.log(`asset is ${JSON.stringify(asset)}`)
    await download(asset.browser_download_url, `temp/${asset.name}`)

    const files = await listDir("temp")

    console.log(`downloaded files: ${files}`)
    return {
        tag_name: latest.tag_name,
        file_name: asset.name
    }
};

export interface Author {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
}

export interface Uploader {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
}

export interface Asset {
    url: string;
    id: number;
    node_id: string;
    name: string;
    label?: any;
    uploader: Uploader;
    content_type: string;
    state: string;
    size: number;
    download_count: number;
    created_at: Date;
    updated_at: Date;
    browser_download_url: string;
}

export interface Reactions {
    url: string;
    total_count: number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
}

export interface GithubRelease {
    url: string;
    assets_url: string;
    upload_url: string;
    html_url: string;
    id: number;
    author: Author;
    node_id: string;
    tag_name: string;
    target_commitish: string;
    name: string;
    draft: boolean;
    prerelease: boolean;
    created_at: Date;
    published_at: string;
    assets: Asset[];
    tarball_url: string;
    zipball_url: string;
    body: string;
    reactions: Reactions;
}

export const toWinFontsToolPath =`tools/toWinFonts/WeiFonts-main/files/weiwin.py`
