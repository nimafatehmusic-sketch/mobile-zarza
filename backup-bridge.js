
import { registerPlugin } from "@capacitor/core";

const SaveFile = registerPlugin("SaveFile");

window.MobileZarzaBackup = {
  async save(json) {
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `mobile-zarza-backup-${date}.json`;

    const result = await SaveFile.save({
      fileName,
      content: json
    });

    return {
      fileName,
      uri: result.uri
    };
  }
};
