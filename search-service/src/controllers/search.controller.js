import {asyncHandler} from "../utils/asyncHandler.js";
import  {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from  "../utils/ApiResponse.js";

import searchService from "../services/search.service.js";

const searchTrains = asyncHandler(async (req, res) => {
     const { from, to, date } = req.query;
     if (!from || !to) throw new ApiError(400, 'From and To stations are required');
     const results = await searchService.searchTrains(from, to, date || null);
     res.json(new ApiResponse(true, 'Search results', results));
});

const autocomplete = asyncHandler(async (req, res) => {
     const { q } = req.query;
     if (!q || q.length < 2) throw new ApiError(400, 'Query must be at least 2 characters');
     const suggestions = await searchService.autocompleteStation(q);
     res.json(new ApiResponse(true, 'Autocomplete suggestions', suggestions));
});

const debugStations = asyncHandler(async (req, res) => {
     const data = await searchService.getAllStations();
     res.json(new ApiResponse(true, 'Debug stations', data));
});

const debugTrains = asyncHandler(async (req, res) => {
     const data = await searchService.getAllTrains();
     res.json(new ApiResponse(true, 'Debug trains', data));
});

export const ctrl = {
     searchTrains,
     autocomplete,
     debugStations,
     debugTrains
};
