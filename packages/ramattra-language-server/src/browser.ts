import {
	createConnection, BrowserMessageReader, BrowserMessageWriter
} from "vscode-languageserver/browser";

import { onInit } from "./server";

onInit(createConnection(new BrowserMessageReader(self), new BrowserMessageWriter(self)));