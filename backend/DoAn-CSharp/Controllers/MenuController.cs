using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using src.Services;
using src.Models.DTOs;

namespace src.Controllers
{
    [ApiController]
    [Route("api/pois/{poiId:int}/menu")]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menuService;

        public MenuController(IMenuService menuService)
        {
            _menuService = menuService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMenu(int poiId, [FromQuery] string lang = "en")
        {
            var menu = await _menuService.GetMenuByPOIAsync(poiId, lang);
            return Ok(menu);
        }
    }
}
