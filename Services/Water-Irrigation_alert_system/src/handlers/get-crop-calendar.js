const cropCalendarData = require('../data/crop-calendar.json');

/**
 * Get Crop Calendar Lambda
 * Returns detailed growth stages and timeline for a specific crop
 */

exports.handler = async (event) => {
  try {
    console.log('Get Crop Calendar request:', event);

    // Get crop from path parameters
    const crop = event.pathParameters?.crop?.toLowerCase();

    // If no crop specified, return list of available crops
    if (!crop) {
      const availableCrops = Object.keys(cropCalendarData).map(key => ({
        id: key,
        name: cropCalendarData[key].name,
        nameHindi: cropCalendarData[key].nameHindi,
        season: cropCalendarData[key].season,
        totalDuration: cropCalendarData[key].totalDuration,
        sowingMonths: cropCalendarData[key].sowingMonths,
        harvestMonths: cropCalendarData[key].harvestMonths
      }));

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Available crops',
          crops: availableCrops
        })
      };
    }

    // Check if crop exists
    if (!cropCalendarData[crop]) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Crop not found',
          crop,
          availableCrops: Object.keys(cropCalendarData)
        })
      };
    }

    // Get query parameters for filtering
    const queryParams = event.queryStringParameters || {};
    const language = queryParams.language || 'en'; // 'en' or 'hi'
    const includeActivities = queryParams.includeActivities !== 'false';
    const currentDay = queryParams.currentDay ? parseInt(queryParams.currentDay) : null;

    // Get crop data
    const cropData = cropCalendarData[crop];

    // Build response
    const response = {
      crop: crop,
      name: language === 'hi' ? cropData.nameHindi : cropData.name,
      season: cropData.season,
      totalDuration: cropData.totalDuration,
      sowingMonths: cropData.sowingMonths,
      harvestMonths: cropData.harvestMonths,
      totalIrrigations: cropData.totalIrrigations,
      yieldPerHectare: cropData.yieldPerHectare,
      waterRequirement: cropData.waterRequirement,
      stages: cropData.stages.map(stage => {
        const stageData = {
          id: stage.id,
          name: language === 'hi' ? stage.nameHindi : stage.name,
          startDay: stage.startDay,
          endDay: stage.endDay,
          duration: stage.duration,
          description: language === 'hi' ? stage.descriptionHindi : stage.description,
          icon: stage.icon,
          irrigation: stage.irrigation,
          fertilizer: stage.fertilizer,
          temperature: stage.temperature
        };

        // Include activities if requested
        if (includeActivities) {
          stageData.activities = language === 'hi' ? stage.activitiesHindi : stage.activities;
        }

        // Mark current stage if currentDay is provided
        if (currentDay !== null) {
          stageData.isCurrent = currentDay >= stage.startDay && currentDay <= stage.endDay;
          stageData.isCompleted = currentDay > stage.endDay;
          stageData.isPending = currentDay < stage.startDay;
        }

        return stageData;
      })
    };

    // Add current stage info if currentDay is provided
    if (currentDay !== null) {
      const currentStage = cropData.stages.find(
        stage => currentDay >= stage.startDay && currentDay <= stage.endDay
      );

      if (currentStage) {
        response.currentStage = {
          id: currentStage.id,
          name: language === 'hi' ? currentStage.nameHindi : currentStage.name,
          dayInStage: currentDay - currentStage.startDay + 1,
          daysRemaining: currentStage.endDay - currentDay,
          progress: Math.round(((currentDay - currentStage.startDay + 1) / currentStage.duration) * 100)
        };
      }

      response.overallProgress = Math.round((currentDay / cropData.totalDuration) * 100);
      response.daysElapsed = currentDay;
      response.daysRemaining = cropData.totalDuration - currentDay;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error in get-crop-calendar:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to get crop calendar',
        message: error.message
      })
    };
  }
};
