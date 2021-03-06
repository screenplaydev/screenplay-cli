#!/usr/bin/env node
import { PBXNativeTarget, PBXProject } from "xcodejs";
export declare function addScreenplayAppTarget(opts: {
    xcodeProjectPath: string;
    xcodeProject: PBXProject;
    appTarget: PBXNativeTarget;
    appScheme: string;
    workspacePath?: string;
    versionBundleDestination?: string;
    withExtensions?: boolean;
    withFromApp?: boolean;
} & ({
    newAppToken: string;
    appToken: undefined;
} | {
    appToken: string;
    newAppToken: undefined;
})): Promise<readonly [string | null, PBXNativeTarget]>;
