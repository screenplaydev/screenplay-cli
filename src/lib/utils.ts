import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { PBXNativeTarget, PBXProject, PorkspacePath, XCSchemes } from "xcodejs";

export function determineScheme(opts: {
  appTargetName: string;
  porkspace: PorkspacePath;
  schemeName?: string;
}): string {
  const possibleSchemes = XCSchemes.list(opts.porkspace);
  if (!opts.schemeName) {
    if (possibleSchemes.includes(opts.appTargetName)) {
      return opts.appTargetName;
    } else {
      throw Error(
        `Could not infer app scheme name, please provide it using the --app-scheme flag`
      );
    }
  }
  if (possibleSchemes.includes(opts.schemeName)) {
    return opts.schemeName;
  }
  throw Error(
    `Possible schemes ${possibleSchemes} do not include ${opts.schemeName}`
  );
}

export function error(msg: string): never {
  console.log(chalk.yellow(`ERROR: ${msg}`));
  process.exit(1);
}

export function warn(msg: string) {
  console.log(chalk.yellow(`WARNING: ${msg}`));
}

export function readProject(projectPath: string): PBXProject {
  if (!fs.existsSync(projectPath)) {
    error(`Could not find Xcode project ("${projectPath}").`);
  }
  return PBXProject.readFileSync(path.join(projectPath, "project.pbxproj"));
}

export function extractTarget(
  project: PBXProject,
  targetName: string | undefined
): PBXNativeTarget {
  const targets = project.appTargets();
  if (targets.length === 0) {
    error("No app targets detected in the Xcode project.");
  } else if (targets.length === 1) {
    return targets[0];
  } else {
    if (targetName) {
      const target = targets.find((t) => {
        return t.name() === targetName;
      });

      if (target) {
        return target;
      }
    }

    error(
      `More than one app target detected, please specify one with the --app-target flag. (Potential app targets: ${targets.map(
        (t) => {
          return `"${t.name()}"`;
        }
      )})`
    );
  }
}
