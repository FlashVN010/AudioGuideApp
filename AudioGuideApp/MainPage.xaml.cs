using Microsoft.Maui.Controls.Maps;
using Microsoft.Maui.Maps;

using Microsoft.Maui.Devices.Sensors; // Cần để lấy vị trí GPS

namespace AudioGuideApp;

public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();

        // Gọi hàm chạy vị trí khi ứng dụng mở lên
        LoadLocation();
    }

    async void LoadLocation()
    {
        try
        {
            var status = await Permissions.CheckStatusAsync<Permissions.LocationWhenInUse>();
            if (status != PermissionStatus.Granted)
            {
                status = await Permissions.RequestAsync<Permissions.LocationWhenInUse>();
            }

            if (status == PermissionStatus.Granted)
            {
                var location = await Geolocation.GetLocationAsync(new GeolocationRequest
                {
                    DesiredAccuracy = GeolocationAccuracy.Medium
                });

                if (location != null)
                {
                    MyMap.MoveToRegion(MapSpan.FromCenterAndRadius(
                        new Location(location.Latitude, location.Longitude),
                        Distance.FromKilometers(1)));
                }
            }
        }
        catch
        {
            // Bỏ qua lỗi để app không bị sập nếu không có GPS
        }
    }
}