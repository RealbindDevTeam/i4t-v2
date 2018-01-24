import { Meteor } from 'meteor/meteor';
import { Job, JobCollection } from 'meteor/vsivsi:job-collection';
import { UserDetail, UserRewardPoints } from '../../../models/auth/user-detail.model';
import { UserDetails } from '../../../collections/auth/user-detail.collection';
import { WaiterCallDetail } from '../../../models/establishment/waiter-call-detail.model';
import { WaiterCallDetails } from '../../../collections/establishment/waiter-call-detail.collection';
import { Establishment, EstablishmentTurn } from '../../../models/establishment/establishment.model';
import { Establishments, EstablishmentTurns } from '../../../collections/establishment/establishment.collection';
import { Order } from '../../../models/establishment/order.model';
import { Orders } from '../../../collections/establishment/order.collection';
import { Tables } from '../../../collections/establishment/table.collection';
import { _localeFactory } from '@angular/core/src/application_module';
import { RewardPoint } from '../../../models/establishment/reward-point.model';
import { RewardPoints } from '../../../collections/establishment/reward-point.collection';

if (Meteor.isServer) {

  Meteor.methods({
    /**
     * This Meteor Method add a job in the Waiter call queue
     * @param {boolean} _priorityHigh
     * @param {any} _data
     */
    waiterCall: function (_queue: string, _priorityHigh: boolean, _data: any) {
      let priority: string = 'normal';
      let delay: number = 0;
      var waiterCallDetail: string;

      var job = new Job(
        _queue,
        'waiterCall',
        { data: '' }
      );
      job.priority(priority)
        .delay(delay)
        .save();

      if (_priorityHigh) {
        priority = 'critical', delay = 10000;
        WaiterCallDetails.update({ job_id: _data.job_id }, { $set: { waiter_id: _data.waiter_id, job_id: job._doc._id } });
        waiterCallDetail = _data.waiter_call_id;
      } else {
        let newTurn = Meteor.call('turnCreate', _data);
        waiterCallDetail = WaiterCallDetails.collection.insert({
          establishment_id: _data.establishments,
          table_id: _data.tables,
          user_id: _data.user,
          turn: newTurn,
          status: _data.status,
          creation_user: _data.user,
          creation_date: new Date(),
          queue: _queue,
          job_id: job._doc._id,
          type: _data.type,
          order_id: _data.order_id,
        });
      }
      return;
    },

    processJobs: function (job, callback, queueName, data) {
      let data_detail: WaiterCallDetail;
      let usr_id_enabled: UserDetail;

      data_detail = WaiterCallDetails.findOne({ job_id: job._doc._id });
      if (data_detail === undefined || data_detail === null) {
        let dt: any = {
          job_id: job._doc._id,
          waiter_id: data.waiter_id,
          waiter_call_id: data.waiter_call_id
        }
        Meteor.call('waiterCall', queueName, true, dt);       
        data_detail = WaiterCallDetails.findOne({ job_id: job._doc._id });
      }
      
      let establishment = Establishments.findOne({ _id: data_detail.establishment_id });
      usr_id_enabled = Meteor.call('validateWaiterEnabled', data_detail.establishment_id, establishment.max_jobs, data_detail.table_id);
      if (usr_id_enabled === undefined || usr_id_enabled === null) {
        Meteor.call('jobRemove', queueName, job._doc._id, data_detail);
        usr_id_enabled = Meteor.call('validateWaiterEnabled', data_detail.establishment_id, establishment.max_jobs, data_detail.table_id);
      }

      Job.getJob(queueName, job._doc._id, function (err, job) {
        if (job) {
          job.done(function (err, result) { });
          var toDate = new Date().toLocaleDateString();
          EstablishmentTurns.update({ establishment_id: data_detail.establishment_id, creation_date: { $gte: new Date(toDate) } },
            {
              $set: { last_waiter_id: usr_id_enabled.user_id, modification_user: 'SYSTEM', modification_date: new Date(), }
            });
          //Waiter call detail update in completed state
          WaiterCallDetails.update({ job_id: job._doc._id },
            {
              $set: { "waiter_id": usr_id_enabled.user_id, "status": "completed" }
            });
          //Waiter update of current jobs and state
          let usr_jobs: number = usr_id_enabled.jobs + 1;
          if (usr_jobs < establishment.max_jobs) {
            UserDetails.update({ user_id: usr_id_enabled.user_id }, { $set: { "jobs": usr_jobs } });
          } else if (usr_jobs == establishment.max_jobs) {
            UserDetails.update({ user_id: usr_id_enabled.user_id }, { $set: { "enabled": false, "jobs": usr_jobs } });
          }
        }
      });
      callback();
    },

    /**
     * Job remove
     * @param pQueueName 
     * @param pJobId 
     * @param pDataDetail 
     * @param pEnabled 
     */
    jobRemove(pQueueName, pJobId, pDataDetail) {
      Job.getJob(pQueueName, pJobId, function (err, job) {
        if (job) {
          job.cancel();
          job.remove(function (err, result) {
            if (result) {
              if (pDataDetail !== null && pDataDetail !== undefined) {
                var data: any = {
                  job_id: job._doc._id,
                  establishments: pDataDetail.establishment_id,
                  tables: pDataDetail.table_id,
                  user: pDataDetail.user_id,
                  waiter_id: pDataDetail.waiter_id,
                  status: 'waiting'
                };
                Meteor.call('waiterCall', pQueueName, true, data);
              }
            }
          });
        }
      });
    },

    /**
     * This Meteor method allow get new turn to the client
     * @param { any } _data 
     */
    turnCreate(_data: any): number {
      var newTurn: number = 1;
      var toDate = new Date().toLocaleDateString();
      var establishmentTurn: EstablishmentTurn = EstablishmentTurns.findOne({
        establishment_id: _data.establishments,
        creation_date: { $gte: new Date(toDate) }
      });

      if (establishmentTurn) {
        newTurn = establishmentTurn.turn + 1;
        EstablishmentTurns.update(
          { _id: establishmentTurn._id },
          {
            $set: { turn: newTurn, modification_user: 'SYSTEM', modification_date: new Date(), }
          });
      } else {
        EstablishmentTurns.insert({
          establishment_id: _data.establishments,
          turn: newTurn,
          last_waiter_id: "",
          creation_user: 'SYSTEM',
          creation_date: new Date(),
        });
      }
      return newTurn;
    },

    /**
     * This Meteor Method allow delete a job in the Waiter call queue
     * @param {string} _waiter_call_detail_id
     * @param {string} _waiter_id
     */
    closeCall: function (_jobDetail: WaiterCallDetail, _waiter_id: string) {
      Job.getJob(_jobDetail.queue, _jobDetail.job_id, function (err, job) {
        job.remove(function (err, result) {
          WaiterCallDetails.update({ _id: _jobDetail._id },
            {
              $set: { "status": "closed", modification_user: _waiter_id, modification_date: new Date() }
            });

          let waiterDetail = WaiterCallDetails.findOne({ job_id: _jobDetail.job_id });
          if (waiterDetail.type === "CUSTOMER_ORDER" && waiterDetail.order_id !== null) {
            let _lOrder: Order = Orders.findOne({ _id: waiterDetail.order_id });
            let _lConsumerDetail: UserDetail = UserDetails.findOne({ user_id: _lOrder.creation_user });
            if (_lOrder.total_reward_points > 0) {
              let _lExpireDate = new Date();
              RewardPoints.insert({
                id_user: _lOrder.creation_user,
                establishment_id: _lOrder.establishment_id,
                points: _lOrder.total_reward_points,
                days_to_expire: 30,
                gain_date: new Date(),
                expire_date: new Date(_lExpireDate.setDate(_lExpireDate.getDate() + 30)),
                is_active: true
              });

              if (_lConsumerDetail.reward_points === null || _lConsumerDetail.reward_points === undefined) {
                let _lUserReward: UserRewardPoints = { establishment_id: _lOrder.establishment_id, points: _lOrder.total_reward_points }
                UserDetails.update({ _id: _lConsumerDetail._id }, { $set: { reward_points: [_lUserReward] } });
              } else {
                let _lPoints: UserRewardPoints = _lConsumerDetail.reward_points.filter(p => p.establishment_id === _lOrder.establishment_id)[0];
                UserDetails.update({ _id: _lConsumerDetail._id, 'reward_points.establishment_id': _lOrder.establishment_id },
                  { $set: { 'reward_points.$.points': (_lPoints.points + _lOrder.total_reward_points) } });
              }
            }

            _lOrder.items.forEach((it) => {
              if (it.is_reward) {
                  let _lRedeemedPoints: number = it.redeemed_points;
                  let _lValidatePoints: boolean = true;
                  RewardPoints.collection.find({ id_user: _lOrder.creation_user, establishment_id: _lOrder.establishment_id }, { sort: { gain_date: -1 } }).fetch().forEach((pnt) => {
                      if (_lValidatePoints) {
                          if (pnt.difference !== null && pnt.difference !== undefined && pnt.difference !== 0) {
                              let aux: number = pnt.points - pnt.difference;
                              _lRedeemedPoints = _lRedeemedPoints - aux;
                              RewardPoints.update({ _id: pnt._id }, { $set: { points: pnt.difference, difference: 0 } });
                          } else if (!pnt.is_active) {
                              _lRedeemedPoints = _lRedeemedPoints - pnt.points;
                              if (_lRedeemedPoints === 0) {
                                  _lValidatePoints = false;
                              }
                          }
                      }
                  });
              }
          });

            Orders.update({ _id: waiterDetail.order_id },
              {
                $set: {
                  status: 'ORDER_STATUS.RECEIVED',
                  modification_user: _waiter_id,
                  modification_date: new Date()
                }
              }
            );
          }

          let usr_detail: UserDetail = UserDetails.findOne({ user_id: _waiter_id });
          if (usr_detail) {
            let jobs = usr_detail.jobs - 1;
            UserDetails.update({ _id: usr_detail._id }, { $set: { "enabled": true, "jobs": jobs } });
          }
        });
      });
      return;
    },

    cancelOrderCall: function (_jobDetail: WaiterCallDetail, _waiter_id: string) {
      Job.getJob(_jobDetail.queue, _jobDetail.job_id, function (err, job) {
        job.remove(function (err, result) {
          WaiterCallDetails.update({ _id: _jobDetail._id },
            {
              $set: { "status": "closed", modification_user: _waiter_id, modification_date: new Date() }
            });

          let waiterDetail = WaiterCallDetails.findOne({ job_id: _jobDetail.job_id });
          if (waiterDetail.type === "CUSTOMER_ORDER" && waiterDetail.order_id !== null) {
            let _lOrder: Order = Orders.findOne({ _id: waiterDetail.order_id });
            if (_lOrder.status === 'ORDER_STATUS.CONFIRMED') {
              _lOrder.items.forEach((it) => {
                if (it.is_reward) {
                  let _lConsumerDetail: UserDetail = UserDetails.findOne({ user_id: _lOrder.creation_user });
                  let _lPoints: UserRewardPoints = _lConsumerDetail.reward_points.filter(p => p.establishment_id === _lOrder.establishment_id)[0];

                  UserDetails.update({ _id: _lConsumerDetail._id, 'reward_points.establishment_id': _lOrder.establishment_id },
                    { $set: { 'reward_points.$.points': (Number.parseInt(_lPoints.points.toString()) + Number.parseInt(it.redeemed_points.toString())) } });

                  let _lRedeemedPoints: number = it.redeemed_points;
                  let _lValidatePoints: boolean = true;
                  RewardPoints.collection.find({ id_user: _lOrder.creation_user, establishment_id: _lOrder.establishment_id }, { sort: { gain_date: -1 } }).fetch().forEach((pnt) => {
                    if (_lValidatePoints) {
                      if (pnt.difference !== null && pnt.difference !== undefined && pnt.difference !== 0) {
                        let aux: number = pnt.points - pnt.difference;
                        _lRedeemedPoints = _lRedeemedPoints - aux;
                        RewardPoints.update({ _id: pnt._id }, { $set: { difference: 0 } });
                      } else if (!pnt.is_active) {
                        _lRedeemedPoints = _lRedeemedPoints - pnt.points;
                        RewardPoints.update({ _id: pnt._id }, { $set: { is_active: true } });
                        if (_lRedeemedPoints === 0) {
                          _lValidatePoints = false;
                        }
                      }
                    }
                  });
                }
              });

              Orders.update({ _id: _lOrder._id }, {
                $set: {
                  status: 'ORDER_STATUS.CANCELED', modification_user: _jobDetail.waiter_id,
                  modification_date: new Date()
                }
              }
              );
            }
          }

          let usr_detail: UserDetail = UserDetails.findOne({ user_id: _waiter_id });
          if (usr_detail) {
            let jobs = usr_detail.jobs - 1;
            UserDetails.update({ _id: usr_detail._id }, { $set: { "enabled": true, "jobs": jobs } });
          }
        });
      });
      return;
    },

    closeWaiterCall: function (_jobDetail: WaiterCallDetail) {
      Job.getJob(_jobDetail.queue, _jobDetail.job_id, function (err, job) {
        job.remove(function (err, result) {
          WaiterCallDetails.update({ _id: _jobDetail._id },
            {
              $set: { "status": "closed", modification_user: _jobDetail.waiter_id, modification_date: new Date() }
            });

          let usr_detail: UserDetail = UserDetails.findOne({ user_id: _jobDetail.waiter_id });
          if (usr_detail) {
            let jobs = usr_detail.jobs - 1;
            UserDetails.update({ _id: usr_detail._id }, { $set: { "enabled": true, "jobs": jobs } });
          }
        });
      });
      return;
    },

    /**
     * This meteor method allow cancel call to waiter by the user
     * @param {WaiterCallDetail} _jobDetail
     * @param {string} _userId
     */
    cancelCallClient: function (_jobDetail: WaiterCallDetail, _userId: string) {
      Job.getJob(_jobDetail.queue, _jobDetail.job_id, function (err, job) {
        if (job._doc.status !== 'completed') {
          job.cancel();
        }
        job.remove(function (err, result) {
          WaiterCallDetails.update({ job_id: _jobDetail.job_id },
            {
              $set: { "status": "cancel", modification_user: _userId, modification_date: new Date() }
            });

          let waiterDetail = WaiterCallDetails.findOne({ job_id: _jobDetail.job_id });
          if (waiterDetail.type === "CALL_OF_CUSTOMER" && waiterDetail.waiter_id) {
            let usr_detail = UserDetails.findOne({ user_id: waiterDetail.waiter_id });
            if (usr_detail) {
              let jobs = usr_detail.jobs - 1;
              UserDetails.update({ user_id: waiterDetail.waiter_id }, { $set: { "enabled": true, "jobs": jobs } });
            }
          }
        });
      });
    },

    /**
     * This function validate waiters enabled
     * @param {string} _establishment
     * @param {string} _maxJobs
     */
    validateWaiterEnabled(_establishment: string, _maxJobs: string, _tableId: string): UserDetail {
      let usr: UserDetail = null;
      let position: number = 0;
      let _randomLast: string;

      let table = Tables.findOne({ _id: _tableId });
      let waiterEnableds = UserDetails.collection.find({
        establishment_work: _establishment,
        is_active: true,
        enabled: true,
        role_id: "200",
        jobs: { $lt: _maxJobs },
        table_assignment_init: { $lte: table._number },
        table_assignment_end: { $gte: table._number }
      });
      var count = waiterEnableds.count();

      if (count > 0) {
        let establishmentTurn = EstablishmentTurns.findOne({ "establishment_id": _establishment },
          {
            sort: { "creation_date": -1 }
          }
        );
        if (establishmentTurn) {
          _randomLast = establishmentTurn.last_waiter_id;
        }
        do {
          position = Meteor.call('getRandomInt', 0, count - 1);
          usr = waiterEnableds.fetch()[position];
        }
        while (usr.user_id == _randomLast && count > 1);
        return usr;
      } else {
        return null;
      }
    },

    /**
    * This function return a random number
    */
    getRandomInt(min, max): number {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
  });
}
