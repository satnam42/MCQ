const contentStatusService = require('../services/contentStatusService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const getSettings = async (req, res, next) => {
  try {
    const durationDays = await contentStatusService.getNewContentDurationDays();
    const deploymentDate = await contentStatusService.getFeatureDeploymentDate();

    return successResponse(
      res,
      {
        newContentDurationDays: durationDays,
        featureDeploymentDate: deploymentDate.toISOString(),
        settings: {
          new_content_duration_days: String(durationDays),
          feature_deployment_date: deploymentDate.toISOString(),
        },
      },
      'System settings retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const durationInput =
      req.body.newContentDurationDays !== undefined
        ? req.body.newContentDurationDays
        : req.body.new_content_duration_days;

    if (durationInput === undefined) {
      return errorResponse(res, 'new_content_duration_days parameter is required', 'INVALID_PARAM', 400);
    }

    const updatedDays = await contentStatusService.updateNewContentDurationDays(durationInput);
    const deploymentDate = await contentStatusService.getFeatureDeploymentDate();

    return successResponse(
      res,
      {
        newContentDurationDays: updatedDays,
        new_content_duration_days: updatedDays,
        featureDeploymentDate: deploymentDate.toISOString(),
      },
      `New content duration updated to ${updatedDays} days.`
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
