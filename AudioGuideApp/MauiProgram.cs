using Microsoft.Maui.LifecycleEvents;

namespace AudioGuideApp;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiMaps() // Bật Maps lên
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // QUAN TRỌNG: Thêm đoạn này để sửa lỗi System.TypeLoadException trên Android

        return builder.Build();
    }
}