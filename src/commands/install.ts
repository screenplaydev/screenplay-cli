import chalk from "chalk";
import path from "path";
import { XCSchemes } from "xcodejs";
import { InstallArgs, InstallVersionBundleArgs } from "../index";
import { determineScheme, extractTarget, readProject } from "../lib/utils";
import { addScreenplayAppTarget } from "../targets/screenplay_target";
import { addTests } from "../targets/test_target";
import { removeScreenplayManagedTargetsAndProducts } from "./uninstall";

export async function install(
  argv: InstallArgs,
  versionBundleOnlyArgs?: InstallVersionBundleArgs
) {
  const xcodeProject = readProject(argv["xcode-project"]);
  const xcodeFileName = path.basename(argv["xcode-project"]);
  const porkspace = {
    project: argv["xcode-project"],
    workspace: argv["workspace"],
  };

  // To get idempotency, we simply remove and re-install
  removeScreenplayManagedTargetsAndProducts(xcodeProject);
  const appTarget = extractTarget(xcodeProject, argv["app-target"]);

  if (versionBundleOnlyArgs) {
    // Make sure to set synthetic versions on the version bundle source target (not the new one)
    appTarget
      .buildConfigurationList()
      .buildConfigs()
      .forEach((buildConfig) => {
        buildConfig.buildSettings()["MARKETING_VERSION"] =
          versionBundleOnlyArgs["app-version"];
      });
  }

  const schemeName = determineScheme({
    appTargetName: appTarget.name(),
    porkspace: porkspace,
    schemeName: argv["app-scheme"],
  });

  const [screenplayAppId, buildTarget] = await addScreenplayAppTarget({
    xcodeProjectPath: argv["xcode-project"],
    xcodeProject: xcodeProject,
    appTarget: appTarget,
    newAppToken: argv["key"] as string,
    appToken: argv["appToken"] as undefined,
    appScheme: schemeName,
    workspacePath: argv["workspace"],
    withExtensions: argv["with-extensions"],
    withFromApp: argv["with-from-app"],
    versionBundleDestination:
      versionBundleOnlyArgs && versionBundleOnlyArgs.destination,
  });

  const newSchemeName = XCSchemes.createSchema({
    srcSchemeName: schemeName,
    workspacePath: argv["workspace"],
    projectPath: argv["xcode-project"],
    srcAppTarget: appTarget,
    newBuildTarget: buildTarget,
    buildableNameExtension: "app",
  });

  if (argv["with-tests"]) {
    addTests({
      xcodeFileName,
      projectPath: argv["xcode-project"],
      workspacePath: argv["workspace"],
      xcodeProject,
      appTarget: buildTarget,
      appScheme: newSchemeName,
    });
  }

  xcodeProject.writeFileSync(
    path.join(argv["xcode-project"], "project.pbxproj")
  );

  console.log(chalk.cyanBright("Screenplay successfully installed!"));
  if (screenplayAppId) {
    console.log(
      `Visit https://screenplay.dev/app/${screenplayAppId} to manage rollbacks`
    );
  }
}
