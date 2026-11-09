
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

window.MobileZarzaBackup = {
  async save(json) {
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `mobile-zarza-backup-${date}.json`;

    const saved = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      recursive: true
    });

    await Share.share({
      title: "پشتیبان‌گیری موبایل زرزا",
      text: "فایل پشتیبان موبایل زرزا",
      url: saved.uri,
      dialogTitle: "ذخیره نسخه پشتیبان"
    });

    return fileName;
  }
};
