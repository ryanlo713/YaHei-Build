import {downloadFromGithubLatestRelease, runProcess, writeToGithubEnv} from "./utils.ts"

await Deno.mkdir("temp")
{

    const {tag_name, file_name} = await downloadFromGithubLatestRelease("be5invis/Sarasa-Gothic",
        "SarasaUiCL-TTF-1.0.25.7z")

    await writeToGithubEnv([
        {key: "SANS_VERSION", value: `Sarasa-${tag_name}`},
        {key: "SANS_UI_VERSION", value: `Sarasa-${tag_name}`}
    ])
    Deno.mkdirSync("source")

    await runProcess(["7z", "x", "-osource", `temp/${file_name}`])

    const sansFonts = Deno.readDirSync(`source/`)
    await Deno.mkdir("sans")
    for (const font of sansFonts) {
        const src = `source/${font.name}`
        if (src.includes("HW") || src.includes(".txt") || src.includes("Normal")) continue
        const dest = `sans/${font.name}`
        console.log(`copy ${src} to ${dest}`)
        Deno.copyFileSync(src, dest)
    }
}

{
    const {tag_name, file_name}  = await downloadFromGithubLatestRelease("GuiWonder/Shanggu",
        "ShangguSerifTTFs.7z")
    await runProcess(["7z", "x", "-osource", `temp/${file_name}`])

    await Deno.mkdir("serif")
    const weights = ["Bold", "Regular", "SemiBold"]
    for (const w of weights) {
            const src = `source/ShangguSerifJP/ShangguSerifJP-${w}.ttf`
            const dest = `serif/ShangguSerifJP-${w}.ttf`
            console.log(`copy ${src} to ${dest}`)
            Deno.copyFileSync(src, dest)
    }


    await writeToGithubEnv([{
        key: "SERIF_VERSION",
        value: `Shanggu-${tag_name}`
    }])
}
