import {
	createConnection
} from "vscode-languageserver/node";

import { onInit } from "./server";

onInit(createConnection());